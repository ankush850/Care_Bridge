import { createClient } from '@/lib/supabase/server'
import { MedicationsView } from '@/components/medications/medications-view'

export default async function MedicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MedicationsView medications={medications || []} userId={user.id} />
}
