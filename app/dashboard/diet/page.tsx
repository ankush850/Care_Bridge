import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DietTrackerUI } from '@/components/dashboard/diet/tracker-ui'

export default async function DietPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen p-4 md:p-8 pt-20 lg:pt-8 w-full overflow-y-auto">
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">Diet & Hydration</h1>
                <p className="text-muted-foreground mt-2">
                    Track your daily meals, caloric intake, and ensure you stay hydrated.
                </p>
            </div>

            <div className="flex-1 w-full min-h-[500px]">
                <DietTrackerUI user={user} />
            </div>
        </div>
    )
}
