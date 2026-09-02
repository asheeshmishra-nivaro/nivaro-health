import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc,
    increment,
    writeBatch,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
    User,
    Node,
    Patient,
    Consultation,
    Prescription,
    InventoryItem,
    ActivityLog,
    UserRole,
    OperatorWalletTransaction,
    DiagnosticOrder,
    AppNotification,
    Followup,
    CDSSSuggestion,
    GovernanceStats
} from '@/types';

// --- CDSS RULES ENGINE ---
export const CDSS_RULES: CDSSSuggestion[] = [
    {
        symptom: 'Fever',
        possibleDiagnoses: ['Viral Fever', 'Malaria', 'Dengue'],
        suggestedTests: ['CBC', 'Malaria Test', 'Dengue NS1'],
        suggestedMedicines: ['Paracetamol 500mg', 'Ibuprofen 400mg']
    },
    {
        symptom: 'Cough',
        possibleDiagnoses: ['Upper Respiratory Infection', 'Bronchitis', 'Pneumonia'],
        suggestedTests: ['Chest X-Ray', 'Sputum Test'],
        suggestedMedicines: ['Amoxicillin 500mg', 'Cough Syrup']
    },
    {
        symptom: 'High BP',
        possibleDiagnoses: ['Hypertension', 'Hypertensive Emergency'],
        suggestedTests: ['ECG', 'Kidney Panel'],
        suggestedMedicines: ['Amlodipine 5mg', 'Telmisartan 40mg']
    },
    {
        symptom: 'High Sugar',
        possibleDiagnoses: ['Diabetes Mellitus', 'Hyperglycemia'],
        suggestedTests: ['HbA1c', 'Random Blood Sugar'],
        suggestedMedicines: ['Metformin 500mg', 'Glimepiride 2mg']
    }
];

export const getCDSSSuggestions = (symptoms: string): CDSSSuggestion[] => {
    const term = symptoms.toLowerCase();
    return CDSS_RULES.filter(rule =>
        term.includes(rule.symptom.toLowerCase()) ||
        rule.possibleDiagnoses.some(d => term.includes(d.toLowerCase()))
    );
};

// Logging Helper
export const logActivity = async (
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    details: string,
    nodeId: string
) => {
    try {
        const logRef = collection(db, 'activityLogs');
        await addDoc(logRef, {
            userId,
            userName,
            userRole,
            action,
            details,
            nodeId,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Logging failed:', error);
    }
};

// --- USER OPERATIONS ---
export const createUserProfile = async (uid: string, data: Partial<User>) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
    });
};

// --- NODE OPERATIONS ---
export const createNode = async (data: Partial<Node>) => {
    const nodeRef = collection(db, 'nodes');
    return await addDoc(nodeRef, {
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

// --- PATIENT OPERATIONS ---
export const registerPatient = async (patientData: Partial<Patient>, operatorId: string, nodeId: string) => {
    const patientsRef = collection(db, 'patients');
    const patientDoc = await addDoc(patientsRef, {
        ...patientData,
        nodeId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return patientDoc.id;
};

// --- CONSULTATION LOOP ---
export const initiateConsultation = async (
    patientId: string,
    patientName: string,
    operatorId: string,
    vitals: any,
    nodeId: string,
    doctorId: string // Added doctorId
) => {
    const consultationRef = collection(db, 'consultations');
    const docRef = await addDoc(consultationRef, {
        patientId,
        patientName,
        operatorId,
        nodeId,
        vitals,
        doctorId,
        status: 'doctor-assigned',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // Notify assigned doctor
    await createNotification({
        userId: doctorId,
        title: 'New Clinical Assignment',
        message: `High-priority consultation requested for ${patientName}.`,
        type: 'warning',
        read: false
    });

    return docRef.id;
};

export const finalizeConsultation = async (
    consultationId: string,
    doctorId: string,
    notes: string,
    prescriptionData: any
) => {
    const batch = writeBatch(db);

    // 1. Create Prescription
    const prescriptionRef = doc(collection(db, 'prescriptions'));
    batch.set(prescriptionRef, {
        ...prescriptionData,
        consultationId,
        doctorId,
        status: 'pending', // CRITICAL: Ensure it shows in operator queue
        createdAt: serverTimestamp()
    });

    // 2. Notify Operator
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, {
        userId: prescriptionData.operatorId || prescriptionData.nodeId, // Link to node if operator ID is missing
        title: 'New Prescription Issued',
        message: `Prescription ready for processing. Patient: ${prescriptionData.patientId.slice(-6).toUpperCase()}`,
        type: 'info',
        read: false,
        createdAt: serverTimestamp()
    });

    // 2. Update Consultation
    const consultationRef = doc(db, 'consultations', consultationId);
    batch.update(consultationRef, {
        clinicalNotes: notes,
        prescriptionId: prescriptionRef.id,
        labTests: prescriptionData.labTests || [], // Save lab tests to consultation
        status: 'completed',
        doctorId,
        updatedAt: serverTimestamp()
    });

    await batch.commit();

    // 3. Record Operator Commission
    const consultationSnap = await getDoc(consultationRef);
    if (consultationSnap.exists()) {
        const data = consultationSnap.data();
        await addWalletTransaction({
            operatorId: data.operatorId,
            patientId: data.patientId,
            patientName: data.patientName,
            serviceType: 'Consultation',
            commissionEarned: 40,
            status: 'completed'
        });

        // 4. Automated Follow-up Scheduling (Day after last medicine dose)
        let maxDuration = 1;
        if (prescriptionData.medicines && prescriptionData.medicines.length > 0) {
            prescriptionData.medicines.forEach((m: any) => {
                const days = parseInt(m.duration) || 0;
                if (days > maxDuration) maxDuration = days;
            });
        }

        await scheduleFollowup({
            consultationId,
            patientId: data.patientId,
            patientName: data.patientName,
            doctorId,
            nodeId: data.nodeId,
            reason: `Post-treatment assessment for ${prescriptionData.diagnosis}`,
            followupDate: Timestamp.fromMillis(Date.now() + (maxDuration + 1) * 24 * 60 * 60 * 1000)
        });
    }

    return prescriptionRef.id;
};

export const scheduleFollowup = async (data: Omit<Followup, 'id' | 'createdAt' | 'status'>) => {
    const followupRef = collection(db, 'followups');
    await addDoc(followupRef, {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp()
    });

    // Notify Operator about future followup
    await createNotification({
        userId: 'NODE_OPERATORS_' + data.nodeId,
        title: 'Follow-up Scheduled',
        message: `Patient ${data.patientName} scheduled for follow-up on ${new Date(data.followupDate.toMillis()).toLocaleDateString()}.`,
        type: 'info',
        read: false
    });
};

export const getPrescription = async (id: string) => {
    const docRef = doc(db, 'prescriptions', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Prescription;
    }
    return null;
};

export const dispensePrescription = async (prescriptionId: string, operatorId: string) => {
    const batch = writeBatch(db);
    const presRef = doc(db, 'prescriptions', prescriptionId);
    const presSnap = await getDoc(presRef);

    if (!presSnap.exists()) throw new Error('Prescription not found');
    const data = presSnap.data();

    // 1. Mark as dispensed
    batch.update(presRef, { status: 'dispensed', updatedAt: serverTimestamp() });

    // 2. Deduct inventory and log (if medicine IDs exist)
    if (data.medicines) {
        for (const med of data.medicines) {
            if (med.id) {
                const itemRef = doc(db, 'inventory', data.nodeId, 'items', med.id);
                // Calculate quantity to deduct based on dosage/duration
                const timesPerDay = Object.values(med.timing).filter(t => t).length;
                const days = parseInt(med.duration) || 1;
                const quantity = timesPerDay * days;
                batch.update(itemRef, { totalQuantity: increment(-quantity) });
            }
        }
    }

    await batch.commit();

    // 3. Record Medicine Commission (+₹20)
    await addWalletTransaction({
        operatorId,
        patientId: data.patientId,
        patientName: 'Pharmacy Delivery', // Could fetch from patients collection
        serviceType: 'Medicine',
        commissionEarned: 20,
        status: 'completed'
    });
};

export const recordDiagnosticsCommission = async (consultationId: string, operatorId: string) => {
    const consulRef = doc(db, 'consultations', consultationId);
    const snap = await getDoc(consulRef);

    if (snap.exists()) {
        const data = snap.data();
        await addWalletTransaction({
            operatorId,
            patientId: data.patientId,
            patientName: data.patientName || 'Lab Test',
            serviceType: 'Diagnostics',
            commissionEarned: 50,
            status: 'completed'
        });
    }
};

// --- WALLET OPERATIONS ---
export const addWalletTransaction = async (data: Omit<OperatorWalletTransaction, 'id' | 'createdAt'>) => {
    const transactionRef = collection(db, 'operator_wallet_transactions');
    await addDoc(transactionRef, {
        ...data,
        createdAt: serverTimestamp()
    });
};

export const getWalletTransactions = async (operatorId: string) => {
    const transactionsRef = collection(db, 'operator_wallet_transactions');
    const q = query(
        transactionsRef,
        where('operatorId', '==', operatorId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OperatorWalletTransaction));
};

export const getDoctors = async (availability?: 'online' | 'offline' | 'busy') => {
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('role', '==', 'DOCTOR'), where('status', '==', 'active'));

    if (availability) {
        q = query(q, where('availability', '==', availability));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
};

// --- INVENTORY OPERATIONS (LIFECYCLE ENGINE) ---
export const addInventoryItem = async (nodeId: string, item: Partial<InventoryItem>) => {
    const itemsRef = collection(db, 'inventory', nodeId, 'items');
    return await addDoc(itemsRef, {
        ...item,
        totalQuantity: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const addInventoryBatch = async (
    nodeId: string,
    itemId: string,
    batchData: { batchNumber: string; quantity: number; expiryDate: any }
) => {
    const batch = writeBatch(db);

    // 1. Add Batch Doc
    const batchRef = doc(collection(db, 'inventory', nodeId, 'items', itemId, 'batches'));
    batch.set(batchRef, {
        ...batchData,
        receivedAt: serverTimestamp()
    });

    // 2. Increment Total Quantity
    const itemRef = doc(db, 'inventory', nodeId, 'items', itemId);
    batch.update(itemRef, {
        totalQuantity: increment(batchData.quantity),
        updatedAt: serverTimestamp()
    });

    await batch.commit();
};

export const updateInventoryStock = async (
    nodeId: string,
    itemId: string,
    quantityChange: number,
    userId: string,
    userName: string,
    userRole: UserRole,
    reason: string
) => {
    const itemRef = doc(db, 'inventory', nodeId, 'items', itemId);
    const batch = writeBatch(db);

    batch.update(itemRef, {
        totalQuantity: increment(quantityChange),
        updatedAt: serverTimestamp()
    });

    const logRef = doc(collection(db, 'activityLogs'));
    batch.set(logRef, {
        userId,
        userName,
        userRole,
        action: 'INVENTORY_ADJUSTMENT',
        details: `${reason}: ${quantityChange > 0 ? '+' : ''}${quantityChange} units`,
        nodeId,
        timestamp: serverTimestamp(),
        metadata: { itemId, quantityChange }
    });

    await batch.commit();
};

export const getInventory = async (nodeId: string) => {
    const itemsRef = collection(db, 'inventory', nodeId, 'items');
    const snapshot = await getDocs(itemsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
};

export const seedInventory = async (nodeId: string) => {
    const medicines = [
        { name: 'Paracetamol 500mg', category: 'Fever & Pain', unit: 'Tabs', stock: 500, min: 100 },
        { name: 'Ibuprofen 400mg', category: 'Fever & Pain', unit: 'Tabs', stock: 300, min: 50 },
        { name: 'Amlodipine 5mg', category: 'BP & Cardiovascular', unit: 'Tabs', stock: 200, min: 40 },
        { name: 'Telmisartan 40mg', category: 'BP & Cardiovascular', unit: 'Tabs', stock: 150, min: 30 },
        { name: 'Atorvastatin 10mg', category: 'BP & Cardiovascular', unit: 'Tabs', stock: 250, min: 50 },
        { name: 'Metformin 500mg', category: 'Diabetes', unit: 'Tabs', stock: 400, min: 80 },
        { name: 'Glimepiride 2mg', category: 'Diabetes', unit: 'Tabs', stock: 200, min: 40 },
        { name: 'Amoxicillin 500mg', category: 'Antibiotics', unit: 'Caps', stock: 300, min: 60 },
        { name: 'Azithromycin 500mg', category: 'Antibiotics', unit: 'Tabs', stock: 100, min: 20 },
        { name: 'Omeprazole 20mg', category: 'Gastrointestinal', unit: 'Caps', stock: 400, min: 80 },
        { name: 'Pantoprazole 40mg', category: 'Gastrointestinal', unit: 'Tabs', stock: 300, min: 60 },
        { name: 'Cetirizine 10mg', category: 'Allergy', unit: 'Tabs', stock: 500, min: 100 },
        { name: 'Montelukast 10mg', category: 'Respiratory', unit: 'Tabs', stock: 200, min: 40 },
        { name: 'Vitamin C 500mg', category: 'Supplements', unit: 'Tabs', stock: 1000, min: 200 },
        { name: 'Multivitamin', category: 'Supplements', unit: 'Caps', stock: 500, min: 100 },
        { name: 'Calcium + D3', category: 'Supplements', unit: 'Tabs', stock: 400, min: 80 },
        { name: 'Cefixime 200mg', category: 'Antibiotics', unit: 'Tabs', stock: 150, min: 30 },
        { name: 'Domperidone 10mg', category: 'Gastrointestinal', unit: 'Tabs', stock: 200, min: 40 },
        { name: 'Losartan 50mg', category: 'BP & Cardiovascular', unit: 'Tabs', stock: 180, min: 30 },
        { name: 'Sitagliptin 100mg', category: 'Diabetes', unit: 'Tabs', stock: 120, min: 20 }
    ];

    const batch = writeBatch(db);

    // 1. Ensure the Node exists in the 'nodes' collection so it appears in the dashboard
    const nodeRef = doc(db, 'nodes', nodeId);
    const nodeSnap = await getDoc(nodeRef);
    if (!nodeSnap.exists()) {
        batch.set(nodeRef, {
            name: 'Primary Clinical Node',
            location: 'Main Medical Campus',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2); // Expiry in 2 years

    for (const med of medicines) {
        const itemRef = doc(collection(db, 'inventory', nodeId, 'items'));
        batch.set(itemRef, {
            name: med.name,
            category: med.category,
            unit: med.unit,
            totalQuantity: med.stock,
            minStockLevel: med.min,
            nodeId,
            batches: [
                {
                    id: 'BATCH-001',
                    batchNumber: 'BN-' + Math.random().toString(36).substring(7).toUpperCase(),
                    expiryDate: Timestamp.fromDate(expiryDate),
                    quantity: med.stock,
                    receivedAt: new Date()
                }
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    await batch.commit();
};

export const getAllActivityLogs = async (limitCount = 50) => {
    const logsRef = collection(db, 'activityLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
};

// --- PARTNER OPERATIONS ---
export const createPartnerRequest = async (data: any) => {
    const partnerRef = collection(db, 'partnerRequests');
    return await addDoc(partnerRef, {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp()
    });
};

// --- PATIENT QUERIES ---
export const getPatientsByNode = async (nodeId: string) => {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('nodeId', '==', nodeId), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
};

// --- DOCTOR HISTORY ---
export const getDoctorConsultationHistory = async (doctorId: string) => {
    const consultationRef = collection(db, 'consultations');
    const q = query(
        consultationRef,
        where('doctorId', '==', doctorId),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation));
};

// --- OPERATOR QUERIES ---
export const getConsultationsByNode = async (nodeId: string, status?: string) => {
    const consultationRef = collection(db, 'consultations');
    let q = query(consultationRef, where('nodeId', '==', nodeId));

    if (status) {
        q = query(q, where('status', '==', status));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation));
};

// --- VIDEO CONSULTATION ENGINE ---
export const createVideoSession = async (
    consultationId: string,
    nodeId: string,
    doctorId: string,
    operatorId: string
) => {
    const sessionRef = collection(db, 'videoSessions');
    const docRef = await addDoc(sessionRef, {
        consultationId,
        nodeId,
        doctorId,
        operatorId,
        status: 'requested',
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateVideoSessionStatus = async (sessionId: string, status: string, additionalData: any = {}) => {
    const sessionRef = doc(db, 'videoSessions', sessionId);
    return await updateDoc(sessionRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp()
    });
};

export const getVideoSession = async (sessionId: string) => {
    const sessionRef = doc(db, 'videoSessions', sessionId);
    const snap = await getDoc(sessionRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
};

// --- DOCTOR & CLINICAL LOGIC (PHASE 3) ---

export const updateDoctorAvailability = async (doctorId: string, availability: 'online' | 'offline' | 'busy') => {
    const userRef = doc(db, 'users', doctorId);
    await updateDoc(userRef, {
        availability,
        updatedAt: serverTimestamp()
    });
};

export const createDiagnosticOrder = async (orderData: Omit<DiagnosticOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const orderRef = collection(db, 'diagnostics_orders');
    const docRef = await addDoc(orderRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // Create notification for operator
    await createNotification({
        userId: 'NODE_OPERATORS_' + orderData.nodeId, // Special tag for broadcast or node-specific
        title: 'New Diagnostic Order',
        message: `Dr. requested ${orderData.tests.join(', ')} for current patient.`,
        type: 'info',
        read: false
    });

    return docRef.id;
};

export const getPatientHistory = async (patientId: string) => {
    const consultationRef = collection(db, 'consultations');
    const q = query(
        consultationRef,
        where('patientId', '==', patientId),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation));
};

export const createNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const notifRef = collection(db, 'notifications');
    await addDoc(notifRef, {
        ...notif,
        createdAt: serverTimestamp()
    });
};

export const getNotifications = async (userId: string) => {
    const notifRef = collection(db, 'notifications');
    const q = query(
        notifRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as AppNotification));
};

export const markNotificationRead = async (notificationId: string) => {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
};

export const getDoctorMetrics = async (doctorId: string) => {
    const consultationRef = collection(db, 'consultations');

    // 1. Fetch Today's Patients (assigned to this doctor)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const qToday = query(
        consultationRef,
        where('doctorId', '==', doctorId),
        where('createdAt', '>=', today)
    );
    const snapToday = await getDocs(qToday);
    const todayCount = snapToday.size;

    // 2. Fetch Active Consultations
    const qActive = query(
        consultationRef,
        where('doctorId', '==', doctorId),
        where('status', '==', 'active')
    );
    const snapActive = await getDocs(qActive);
    const activeCount = snapActive.size;

    // 3. Fetch Completed Today & Avg Duration
    const qCompleted = query(
        consultationRef,
        where('doctorId', '==', doctorId),
        where('status', '==', 'completed'),
        where('updatedAt', '>=', today)
    );
    const snapCompleted = await getDocs(qCompleted);
    const completedCount = snapCompleted.size;

    let totalDuration = 0;
    snapCompleted.docs.forEach(doc => {
        totalDuration += doc.data().duration || 0;
    });
    const avgDuration = completedCount > 0 ? Math.round(totalDuration / completedCount / 60) : 0; // In minutes

    return {
        todayPatients: todayCount,
        activeConsultations: activeCount,
        completedToday: completedCount,
        avgConsultationTime: avgDuration
    };
};

export const getGovernanceStats = async (): Promise<GovernanceStats> => {
    const nodesSnap = await getDocs(collection(db, 'nodes'));
    const usersSnap = await getDocs(collection(db, 'users'));
    const consultsSnap = await getDocs(collection(db, 'consultations'));
    const videoSessionsSnap = await getDocs(collection(db, 'videoSessions'));
    const inventorySnap = await getDocs(collection(db, 'inventory'));

    const users = usersSnap.docs.map(doc => doc.data() as User);
    const nodes = nodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node));
    const videoSessions = videoSessionsSnap.docs.map(doc => doc.data());

    // Calculate Video Session Metrics
    const totalSessions = videoSessions.length;
    const avgDuration = totalSessions > 0
        ? videoSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / totalSessions
        : 0;

    // Calculate Node Health Scores (Mock logic based on consultation volume/errors)
    const nodeHealthScores: Record<string, number> = {};
    nodes.forEach(node => {
        const nodeConsultations = consultsSnap.docs.filter(d => d.data().nodeId === node.id).length;
        nodeHealthScores[node.id] = Math.min(100, 70 + (nodeConsultations * 2)); // Simple mock
    });

    // Inventory Risk Index (Percentage of low stock items)
    const lowStockItems = inventorySnap.docs.filter(d => d.data().quantity <= (d.data().minStockLevel || 10)).length;
    const totalItems = inventorySnap.size || 1;
    const inventoryRiskIndex = (lowStockItems / totalItems) * 100;

    return {
        totalNodes: nodesSnap.size,
        totalDoctors: users.filter(u => u.role === 'DOCTOR').length,
        totalOperators: users.filter(u => u.role === 'OPERATOR').length,
        consultationVolume: consultsSnap.size,
        videoSessionMetrics: {
            totalSessions,
            avgDuration
        },
        inventoryRiskIndex,
        nodeHealthScores
    };
};

// --- REAL-TIME INTERCONNECTED ATTACHMENT & LAB WORKFLOWS ---
export const uploadConsultationAttachment = async (consultationId: string, photoUrl: string, title?: string) => {
    const consulRef = doc(db, 'consultations', consultationId);
    const snap = await getDoc(consulRef);
    if (!snap.exists()) throw new Error('Consultation not found');

    const currentAttachments = snap.data().attachments || [];
    const newAttachment = {
        id: 'att_' + Date.now(),
        url: photoUrl,
        title: title || 'Medical Record Scan',
        uploadedAt: new Date().toISOString()
    };

    await updateDoc(consulRef, {
        attachments: [...currentAttachments, newAttachment],
        updatedAt: serverTimestamp()
    });

    return newAttachment;
};

export const completeDiagnosticOrder = async (orderId: string, results: string, photoUrl?: string) => {
    const orderRef = doc(db, 'diagnosticOrders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('Diagnostic Order not found');

    const data = snap.data();
    await updateDoc(orderRef, {
        status: 'completed',
        notes: results,
        resultPhotoUrl: photoUrl || null,
        updatedAt: serverTimestamp()
    });

    // Notify assigned doctor
    await createNotification({
        userId: data.doctorId,
        title: 'Lab Results Uploaded',
        message: `Diagnostic results ready for review for patient ID ${data.patientId.slice(-6).toUpperCase()}.`,
        type: 'success',
        read: false
    });
};

export const disburseOperatorEarnings = async (operatorId: string, amount: number, adminUserId: string) => {
    const transactionsRef = collection(db, 'operator_wallet_transactions');
    await addDoc(transactionsRef, {
        operatorId,
        patientId: 'PAYOUT_' + Date.now(),
        patientName: 'Admin Wallet Settlement',
        serviceType: 'Payout',
        commissionEarned: -amount, // Debit
        status: 'completed',
        createdAt: serverTimestamp()
    });

    await logActivity(
        adminUserId,
        'Admin Authority',
        'ADMIN',
        'WALLET_DISBURSEMENT',
        `Settled ₹${amount} wallet balance for operator ${operatorId}`,
        'SYSTEM'
    );
};
