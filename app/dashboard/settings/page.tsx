import { createClient } from '@/lib/supabase/server'
import { SettingsView } from '@/components/settings/settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <SettingsView user={user} profile={profile!} />
}
