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
    writeBatch
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
    UserRole
} from '@/types';

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
    nodeId: string
) => {
    const consultationRef = collection(db, 'consultations');
    const docRef = await addDoc(consultationRef, {
        patientId,
        patientName,
        operatorId,
        nodeId,
        vitals,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
        createdAt: serverTimestamp()
    });

    // 2. Update Consultation
    const consultationRef = doc(db, 'consultations', consultationId);
    batch.update(consultationRef, {
        clinicalNotes: notes,
        prescriptionId: prescriptionRef.id,
        status: 'completed',
        doctorId,
        updatedAt: serverTimestamp()
    });

    await batch.commit();
    return prescriptionRef.id;
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

    // For each item, we could fetch batches, but for the main list, totalQuantity is enough.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
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
