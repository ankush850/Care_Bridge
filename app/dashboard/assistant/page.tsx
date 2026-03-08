import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/dashboard/assistant/chat-interface'

export default async function AssistantPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch user profile for personalization
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen p-4 md:p-8 pt-20 lg:pt-8 w-full">
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight">AI Health Assistant</h1>
                <p className="text-muted-foreground mt-2">
                    Ask questions about your symptoms, medications, or general wellness.
                </p>
            </div>

            <div className="flex-1 w-full bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                <ChatInterface user={user} profile={profile || {}} />
            </div>
        </div>
    )
}
