/**
 * Shared TypeScript types - Dasm Inspection
 */

export type AppRole = 'customer' | 'workshop' | 'admin'

export interface User {
  id: string
  email: string
  phone?: string
  fullName?: string
  role: AppRole
  createdAt: string
}

export interface Car {
  id: string
  userId: string
  make: string
  model: string
  year?: number
  plateNumber?: string
  vin?: string
  color?: string
  createdAt: string
}

export interface Workshop {
  id: string
  name: string
  location?: string
  phone?: string
  email?: string
  rating?: number
  isVerified?: boolean
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Inspection {
  id: string
  carId: string
  workshopId?: string
  inspectorId?: string
  status: InspectionStatus
  inspectionDate?: string
  overallScore?: number
  notes?: string
  createdAt: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  userId: string
  workshopId: string
  carId: string
  appointmentDate: string
  status: AppointmentStatus
  serviceType?: string
  notes?: string
  createdAt: string
}
