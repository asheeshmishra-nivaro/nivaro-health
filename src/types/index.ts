export type UserRole = 'ADMIN' | 'DOCTOR' | 'OPERATOR';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  nodeId: string;
  name: string;
  status: 'active' | 'suspended';
  createdAt: any;
  updatedAt: any;
  availability?: 'online' | 'offline' | 'busy'; // Added 'busy' for Phase 5
  specialty?: string;
  licenseNo?: string;
  degree?: string;
  experience?: string;
  hospital?: string;
  rating?: number;
  responseTime?: string;
}

export interface DiagnosticOrder {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  nodeId: string;
  tests: string[];
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  createdAt: any;
}

export interface Node {
  id: string;
  name: string;
  location: string;
  contact: string;
  status: 'active' | 'inactive';
  healthScore?: number;
  totalConsultations?: number;
  createdAt: any;
  updatedAt: any;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contact: string;
  address: string;
  nodeId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Vitals {
  bp: string;
  sugar: string;
  temp: string;
  weight?: string;
  spo2?: string;
  heartRate?: string;
  pulse?: string;
  capturedAt: any;
}

export interface StructuredClinicalData {
  symptoms: string;
  observations: string;
  diagnosis: string;
  advice: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  status: 'pending' | 'completed';
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  operatorId: string;
  nodeId: string;
  vitals: Vitals;
  complaint?: string;
  clinicalData?: StructuredClinicalData;
  clinicalNotes: string; // Legacy field for transition
  status: 'pending' | 'doctor-assigned' | 'active' | 'completed' | 'prescription-issued' | 'cancelled';
  prescriptionId?: string;
  videoSessionId?: string;
  duration?: number; // In seconds
  labTests?: LabTest[]; // Added for diagnostics commission
  createdAt: any;
  updatedAt: any;
}

export interface Medicine {
  id: string; // Reference to inventory item
  name: string;
  dosage: string;
  duration: string;
  timing: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
    morningTime?: string;
    afternoonTime?: string;
    eveningTime?: string;
    nightTime?: string;
  };
  foodRelation?: 'Before Food' | 'After Food';
  frequency?: string;
  dispensed?: boolean;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  nodeId: string;
  medicines: Medicine[];
  status: 'pending' | 'dispensed';
  createdAt: any;
}

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  expiryDate: any;
  quantity: number;
  receivedAt: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  batches: InventoryBatch[];
  totalQuantity: number;
  minStockLevel: number;
  nodeId: string;
  createdAt: any;
  updatedAt: any;
}

export interface VideoSession {
  id: string;
  consultationId: string;
  nodeId: string;
  doctorId: string;
  operatorId: string;
  status: 'requested' | 'active' | 'ended';
  startedAt?: any;
  endedAt?: any;
  duration?: number;
  roomUrl?: string; // For Agora/100ms
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  nodeId: string;
  timestamp: any;
  metadata?: any;
}

export interface OperatorWalletTransaction {
  id: string;
  operatorId: string;
  patientId: string;
  patientName: string;
  serviceType: 'Consultation' | 'Medicine' | 'Diagnostics';
  commissionEarned: number;
  status: 'completed';
  createdAt: any;
}

export interface WalletStats {
  currentBalance: number;
  totalEarnings: number;
  todayEarnings: number;
  thisMonthEarnings: number;
}

export interface GovernanceStats {
  totalNodes: number;
  totalDoctors: number;
  totalOperators: number;
  consultationVolume: number;
  videoSessionMetrics: {
    totalSessions: number;
    avgDuration: number;
  };
  inventoryRiskIndex: number; // 0-100 score
  nodeHealthScores: Record<string, number>;
}

export interface Followup {
  id: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  nodeId: string;
  followupDate: any;
  status: 'pending' | 'completed' | 'missed';
  reason: string;
  createdAt: any;
}

export interface CDSSSuggestion {
  symptom: string;
  possibleDiagnoses: string[];
  suggestedTests: string[];
  suggestedMedicines: string[];
}
