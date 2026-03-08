import { createClient } from '@/lib/supabase/server'
import { AppointmentsView } from '@/components/appointments/appointments-view'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: true })

  return <AppointmentsView appointments={appointments || []} userId={user.id} />
}
