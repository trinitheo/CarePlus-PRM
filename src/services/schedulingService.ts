import { mockDbService } from '../lib/mockDatabase';
import { logAudit } from './auditService';

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  roomId?: string;
  time: any;
  duration: number;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  visitType: 'clinic' | 'virtual';
  reason: string;
  priority: 'routine' | 'urgent' | 'emergency';
}

export interface Room {
  id: string;
  name: string;
  type: 'exam' | 'procedure' | 'telehealth' | 'consult';
  status: 'available' | 'occupied' | 'maintenance';
  currentAppointmentId?: string;
}

export async function getRooms() {
  return mockDbService.getCollection('rooms');
}

export async function updateRoomStatus(roomId: string, status: Room['status'], appointmentId?: string) {
  mockDbService.updateItem('rooms', roomId, {
    status,
    currentAppointmentId: appointmentId || null
  });

  await logAudit({
    action: 'ROOM_STATUS_CHANGE',
    entityId: roomId,
    entityType: 'appointment',
    details: `Room status changed to ${status}`
  });
}

export async function transitionAppointment(appointmentId: string, newStatus: string, roomId?: string) {
  const updates: any = { status: newStatus };
  if (roomId) updates.roomId = roomId;

  mockDbService.updateItem('appointments', appointmentId, updates);

  await logAudit({
    action: 'APPOINTMENT_TRANSITION',
    entityId: appointmentId,
    entityType: 'appointment',
    details: `Appointment moved to status: ${newStatus}`
  });

  if (roomId && (newStatus === 'in_progress' || newStatus === 'in_room')) {
    await updateRoomStatus(roomId, 'occupied', appointmentId);
  } else if (newStatus === 'completed' || newStatus === 'cancelled') {
    const rooms = await getRooms();
    const room = rooms.find((r: any) => r.currentAppointmentId === appointmentId);
    if (room) {
      await updateRoomStatus(room.id, 'available');
    }
  }
}

export async function createAppointment(data: Omit<Appointment, 'id'>) {
  const id = mockDbService.addItem('appointments', data);

  await logAudit({
    action: 'APPOINTMENT_CREATED',
    entityId: id,
    entityType: 'appointment',
    details: `New appointment scheduled for patient ${data.patientId}`
  });

  return id;
}
