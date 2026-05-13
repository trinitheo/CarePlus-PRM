import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './clinicalFirestoreService';

export interface AppointmentData {
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  roomId?: string;
  roomName?: string;
  time: Date;
  duration: number;
  reason: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_room' | 'completed' | 'cancelled' | 'no_show';
  visitType: 'in_clinic' | 'telehealth';
  priority: 'immediate' | 'urgent' | 'routine';
  notes?: string;
}

export async function createAppointment(data: AppointmentData) {
  return await addDoc(collection(db, 'appointments'), {
    ...data,
    time: Timestamp.fromDate(data.time),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateAppointment(id: string, data: Partial<AppointmentData>) {
  const ref = doc(db, 'appointments', id);
  const updatePayload: any = { ...data, updatedAt: serverTimestamp() };
  if (data.time) {
    updatePayload.time = Timestamp.fromDate(data.time);
  }
  return await updateDoc(ref, updatePayload);
}

export async function getAppointmentsByDateRange(start: Date, end: Date) {
  const q = query(
    collection(db, 'appointments'),
    where('time', '>=', Timestamp.fromDate(start)),
    where('time', '<=', Timestamp.fromDate(end)),
    orderBy('time', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function cancelAppointment(id: string) {
  return await updateAppointment(id, { status: 'cancelled' });
}

export interface Room {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export async function transitionAppointment(id: string, status: AppointmentData['status'], roomId?: string, roomName?: string) {
  const updateData: any = { status };
  if (roomId) updateData.roomId = roomId;
  if (roomName) updateData.roomName = roomName;
  return await updateAppointment(id, updateData);
}

export async function getRooms() {
  const snapshot = await getDocs(collection(db, 'rooms'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
}
