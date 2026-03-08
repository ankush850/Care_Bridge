export interface Profile {
  id: string
  full_name: string | null
  date_of_birth: string | null
  phone_number: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_conditions: string[] | null
  allergies: string[] | null
  blood_type: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  time_of_day: string[]
  start_date: string
  end_date: string | null
  instructions: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicationLog {
  id: string
  user_id: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  status: 'pending' | 'taken' | 'missed' | 'skipped'
  notes: string | null
  created_at: string
  medication?: Medication
}

export interface HealthMetric {
  id: string
  user_id: string
  metric_type: 'blood_pressure' | 'heart_rate' | 'blood_sugar' | 'weight' | 'temperature' | 'oxygen_saturation'
  value: Record<string, number | string>
  recorded_at: string
  notes: string | null
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  title: string
  doctor_name: string | null
  location: string | null
  appointment_date: string
  duration_minutes: number
  notes: string | null
  reminder_sent: boolean
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'medication' | 'appointment' | 'health_alert' | 'system'
  title: string
  message: string
  read: boolean
  action_url: string | null
  created_at: string
}

export interface OnboardingData {
  fullName: string
  dateOfBirth: string
  phoneNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalConditions: string[]
  allergies: string[]
  bloodType: string
}
