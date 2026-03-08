import { createClient } from '@/lib/supabase/server'
import { HealthMetricsView } from '@/components/health/health-metrics-view'

export default async function HealthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: metrics } = await supabase
    .from('health_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(100)

  return <HealthMetricsView metrics={metrics || []} userId={user.id} />
}
