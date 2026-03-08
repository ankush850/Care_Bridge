'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User as UserIcon, Activity, Pill, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const FAQ_PROMPTS = [
    {
        id: 'q1',
        icon: Activity,
        question: "Why am I feeling so tired lately?",
        answer: "Fatigue can be caused by many factors including poor sleep quality, high stress, dehydration, or nutritional deficiencies. Try aiming for 7-9 hours of consistent sleep and drinking more water. If fatigue persists for weeks, please consult your doctor."
    },
    {
        id: 'q2',
        icon: Pill,
        question: "What are the common side effects of my medication?",
        answer: "Common side effects for many medications can include nausea, dizziness, or mild fatigue. However, side effects depend entirely on your specific prescription. Always check the label or consult your pharmacist for the exact details of your medication."
    },
    {
        id: 'q3',
        icon: UserIcon,
        question: "How can I improve my daily step count?",
        answer: "Start small! Try taking a 10-minute walk after lunch, parking further away from entrances, or taking the stairs instead of the elevator. Aim for gradual increases of 500-1000 steps per day until you reach your goal."
    },
    {
        id: 'q4',
        icon: AlertCircle,
        question: "When should I see a doctor about a headache?",
        answer: "You should seek immediate medical attention if a headache is sudden and severe (a 'thunderclap' headache), accompanied by fever, stiff neck, confusion, seizures, double vision, numbness, or speaking difficulties."
    }
]

export function ChatInterface({ user, profile }: { user: any, profile: any }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user?.id) return
            setIsLoading(true)

            try {
                const { data, error } = await supabase
                    .from('assistant_chats')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true })

                if (error) throw error

                if (data && data.length > 0) {
                    const mappedMessages: Message[] = data.map(msg => ({
                        id: msg.id,
                        role: msg.role as 'user' | 'assistant',
                        content: msg.message,
                        timestamp: new Date(msg.created_at)
                    }))
                    setMessages(mappedMessages)
                } else {
                    // Start with default welcome message if no history
                    setMessages([{
                        id: 'welcome',
                        role: 'assistant',
                        content: `Hello ${profile?.full_name?.split(' ')[0] || 'there'}! I'm your personal CareBridge Assistant. I can help you understand symptoms, give general wellness advice, or help you track your health goals. How can I help you today?`,
                        timestamp: new Date(),
                    }])
                }
            } catch (error) {
                console.error("Failed to load chat history", error)
                toast.error("Failed to load conversation history")
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [user, profile, supabase])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isTyping])

    const saveMessage = async (role: 'user' | 'assistant', content: string) => {
        try {
            const { data, error } = await supabase
                .from('assistant_chats')
                .insert({
                    user_id: user.id,
                    role: role,
                    message: content
                })
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error(`Failed to save ${role} message`, error)
            return null
        }
    }

    const handleFAQClick = async (question: string, answer: string) => {
        if (!user?.id || isTyping) return

        // Optimistically add user message
        const optimisticUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, optimisticUserMsg])
        setIsTyping(true)

        // Save user message to DB
        const savedUserMsg = await saveMessage('user', question)
        if (savedUserMsg) {
            setMessages(prev => prev.map(m => m.id === optimisticUserMsg.id ? { ...m, id: savedUserMsg.id } : m))
        }

        // Simulated AI response delay
        setTimeout(async () => {
            // Save Assistant message to DB
            const savedAssistantMsg = await saveMessage('assistant', answer)

            const aiResponse: Message = {
                id: savedAssistantMsg ? savedAssistantMsg.id : (Date.now() + 1).toString(),
                role: 'assistant',
                content: answer,
                timestamp: savedAssistantMsg ? new Date(savedAssistantMsg.created_at) : new Date(),
            }

            setMessages(prev => [...prev, aiResponse])
            setIsTyping(false)
        }, 1500 + Math.random() * 1000)
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Disclaimer Banner */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>This AI provides general information and is not a substitute for professional medical advice, diagnosis, or treatment.</p>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-4 pt-2">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex gap-4 w-full",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <Avatar className={cn(
                                    "h-8 w-8 shrink-0",
                                    msg.role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    {msg.role === 'assistant' ? (
                                        <Activity className="h-5 w-5" />
                                    ) : (
                                        <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                    )}
                                </Avatar>

                                <div className={cn(
                                    "flex flex-col gap-1 max-w-[80%]",
                                    msg.role === 'user' ? "items-end" : "items-start"
                                )}>
                                    <div className={cn(
                                        "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground rounded-tl-sm border"
                                    )}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground px-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4 w-full flex-row"
                            >
                                <Avatar className="h-8 w-8 shrink-0 bg-primary text-primary-foreground">
                                    <Bot className="h-5 w-5" />
                                </Avatar>
                                <div className="bg-muted border px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                                    <motion.div
                                        className="w-1.5 h-1.5 rounded-full bg-foreground/40"
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                    />
                                    <motion.div
                                        className="w-1.5 h-1.5 rounded-full bg-foreground/40"
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                    />
                                    <motion.div
                                        className="w-1.5 h-1.5 rounded-full bg-foreground/40"
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                    />
                                </div>
                            </motion.div>
                        )}
                        <div ref={scrollRef} />
                    </AnimatePresence>
                </div>
            </ScrollArea>

            {/* Input Area (Replaced by FAQ Grid) */}
            <div className="p-4 bg-background border-t">
                <div className="max-w-3xl mx-auto flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1 px-1">Suggested Questions</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {FAQ_PROMPTS.map(faq => (
                            <Button
                                key={faq.id}
                                variant="outline"
                                className="justify-start h-auto py-3 px-4 text-left font-normal bg-muted/30 hover:bg-muted whitespace-break-spaces"
                                onClick={() => handleFAQClick(faq.question, faq.answer)}
                                disabled={isTyping}
                            >
                                <faq.icon className="h-4 w-4 mr-3 shrink-0 text-primary" />
                                <span className="text-sm">{faq.question}</span>
                            </Button>
                        ))}
                    </div>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-4 max-w-3xl mx-auto">
                    CareBridge AI can make mistakes. Consider verifying critical medical information.
                </p>
            </div>
        </div>
    )
}
