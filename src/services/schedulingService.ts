import { clinicalService } from './clinicalFirestoreService';
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
  return clinicalService.getCollection('rooms');
}

export async function updateRoomStatus(roomId: string, status: Room['status'], appointmentId?: string) {
  await clinicalService.updateItem('rooms', roomId, {
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

  await clinicalService.updateItem('appointments', appointmentId, updates);

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

export async function cancelAppointment(appointmentId: string, reason?: string) {
  await transitionAppointment(appointmentId, 'cancelled');

  if (reason) {
    await logAudit({
      action: 'APPOINTMENT_CANCELLED',
      entityId: appointmentId,
      entityType: 'appointment',
      details: `Cancellation logged. Reason: ${reason}`
    });
  }
}

export async function rescheduleAppointment(appointmentId: string, newTime: string | Date, newDuration?: number, newRoomId?: string) {
  const updates: any = {
    time: typeof newTime === 'string' ? newTime : newTime.toISOString(),
    status: 'scheduled'
  };
  if (newDuration) updates.duration = newDuration;
  if (newRoomId) updates.roomId = newRoomId;

  await clinicalService.updateItem('appointments', appointmentId, updates);

  await logAudit({
    action: 'APPOINTMENT_RESCHEDULED',
    entityId: appointmentId,
    entityType: 'appointment',
    details: `Appointment rescheduled to ${newTime}`
  });
}

export function checkScheduleConflicts(
  appointments: any[], 
  targetTime: Date, 
  durationMinutes: number, 
  providerId?: string, 
  patientId?: string,
  excludeApptId?: string
): { hasConflict: boolean; conflicts: string[] } {
  const targetStart = targetTime.getTime();
  const targetEnd = targetStart + durationMinutes * 60 * 1000;
  const conflicts: string[] = [];

  for (const appt of appointments) {
    if (appt.id === excludeApptId) continue;
    if (appt.status === 'cancelled' || appt.status === 'completed') continue;

    const apptTime = appt.time?.seconds ? new Date(appt.time.seconds * 1000) : new Date(appt.time);
    const apptStart = apptTime.getTime();
    const apptDuration = appt.duration || 30;
    const apptEnd = apptStart + apptDuration * 60 * 1000;

    // Check overlap
    if (targetStart < apptEnd && targetEnd > apptStart) {
      if (providerId && appt.providerId === providerId) {
        conflicts.push(`Provider double-booked at ${apptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
      if (patientId && appt.patientId === patientId) {
        conflicts.push(`Patient already has an appointment scheduled at ${apptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

export async function createAppointment(data: Omit<Appointment, 'id'>) {
  const id = await clinicalService.addItem('appointments', data);

  await logAudit({
    action: 'APPOINTMENT_CREATED',
    entityId: id,
    entityType: 'appointment',
    details: `New appointment scheduled for patient ${data.patientId}`
  });

  return id;
}

