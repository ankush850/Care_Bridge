import { createClient } from '@/lib/supabase/server'
import { DashboardOverview } from '@/components/dashboard/overview'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch dashboard data
  const [medicationsRes, metricsRes, appointmentsRes, logsRes] = await Promise.all([
    supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(10),
    supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })
      .limit(5),
    supabase
      .from('medication_logs')
      .select('*, medication:medications(*)')
      .eq('user_id', user.id)
      .gte('scheduled_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('scheduled_time', { ascending: true }),
  ])

  return (
    <DashboardOverview
      medications={medicationsRes.data || []}
      healthMetrics={metricsRes.data || []}
      appointments={appointmentsRes.data || []}
      medicationLogs={logsRes.data || []}
    />
  )
}
