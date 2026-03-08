import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AchievementsUI } from '@/components/dashboard/goals/achievements-ui'

export default async function GoalsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen p-4 md:p-8 pt-20 lg:pt-8 w-full overflow-y-auto">
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">Daily Goals & Achievements</h1>
                <p className="text-muted-foreground mt-2">
                    Keep your streaks alive, earn badges, and stay motivated on your health journey.
                </p>
            </div>

            <div className="flex-1 w-full min-h-[500px]">
                <AchievementsUI user={user} />
            </div>
        </div>
    )
}
