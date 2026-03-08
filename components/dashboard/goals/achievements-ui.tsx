'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Target, Star, Award, Footprints, Droplets, Loader2, Play, Square, Pause, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const AVAILABLE_ACHIEVEMENTS = [
    { id: 'a1', key: '7_day_streak', title: '7-Day Streak', description: 'Logged in for 7 consecutive days', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'a2', key: 'hydration_hero', title: 'Hydration Hero', description: 'Met water goal for 3 days in a row', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'a3', key: 'perfect_pill_record', title: 'Perfect Pill Record', description: 'No missed meds this month', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', progress: 60 },
]

const WALK_DURATION = 1800 // 30 minutes
const MED_DURATION = 600   // 10 minutes

export function AchievementsUI({ user }: { user: any }) {
    const [level, setLevel] = useState(1)
    const [xp, setXp] = useState(0)
    const [streak, setStreak] = useState(0)
    const [unlockedKeys, setUnlockedKeys] = useState<string[]>([])
    const [claimedChallenges, setClaimedChallenges] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Challenge States
    const [walkTime, setWalkTime] = useState(WALK_DURATION)
    const [walkActive, setWalkActive] = useState(false)

    const [medTime, setMedTime] = useState(MED_DURATION)
    const [medActive, setMedActive] = useState(false)
    const [medPaused, setMedPaused] = useState(false)

    const [waterCount, setWaterCount] = useState(0)

    // Simple formula for next level: level * 1000
    const nextLevelXp = level * 1000

    const supabase = createClient()

    useEffect(() => {
        const fetchGamificationData = async () => {
            if (!user?.id) return
            setIsLoading(true)

            try {
                // 1. Fetch user level & xp
                const { data: gamificationData, error: gamificationError } = await supabase
                    .from('user_gamification')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (gamificationData) {
                    setLevel(gamificationData.current_level || 1)
                    setXp(gamificationData.total_xp || 0)
                    setStreak(gamificationData.current_streak_days || 0)

                    // Daily Claims recovery
                    const storedClaims = localStorage.getItem(`claimed_challenges_${user.id}`)
                    if (storedClaims) {
                        try {
                            const parsed = JSON.parse(storedClaims)
                            if (parsed.date === new Date().toISOString().split('T')[0]) {
                                setClaimedChallenges(parsed.claims)
                            } else {
                                localStorage.removeItem(`claimed_challenges_${user.id}`)
                            }
                        } catch (e) { }
                    }

                    // Recover Water
                    const storedWater = localStorage.getItem(`water_count_${user.id}`)
                    if (storedWater) {
                        try {
                            const parsed = JSON.parse(storedWater)
                            if (parsed.date === new Date().toISOString().split('T')[0]) {
                                setWaterCount(parsed.count)
                            } else {
                                localStorage.removeItem(`water_count_${user.id}`)
                            }
                        } catch (e) { }
                    }

                } else if (!gamificationError) {
                    await supabase.from('user_gamification').insert({ user_id: user.id })
                }

                // 2. Fetch earned achievements
                const { data: achievementsData } = await supabase
                    .from('user_achievements')
                    .select('achievement_key')
                    .eq('user_id', user.id)

                if (achievementsData) {
                    setUnlockedKeys(achievementsData.map(a => a.achievement_key))
                }

            } catch (error) {
                console.error("Failed to load gamification data", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchGamificationData()
    }, [user, supabase])

    // Timer sync logic using localStorage for persistence
    useEffect(() => {
        if (!user?.id) return

        const interval = setInterval(() => {
            const today = new Date().toISOString().split('T')[0]

            // --- WALK TIMER LOGIC ---
            if (!claimedChallenges.includes('walk')) {
                const walkEnd = localStorage.getItem(`walk_end_${user.id}`)
                if (walkEnd) {
                    const remaining = Math.max(0, Math.floor((parseInt(walkEnd) - Date.now()) / 1000))
                    setWalkTime(remaining)
                    setWalkActive(remaining > 0)
                    if (remaining === 0) {
                        localStorage.removeItem(`walk_end_${user.id}`)
                        handleClaim('walk', 50, '30 Minute Walk')
                    }
                }
            }

            // --- MEDITATION TIMER LOGIC ---
            if (!claimedChallenges.includes('meditation')) {
                const medStateStr = localStorage.getItem(`med_state_${user.id}`)
                if (medStateStr) {
                    const medState = JSON.parse(medStateStr)
                    if (medState.date === today) {
                        if (medState.active && !medState.paused) {
                            const remaining = Math.max(0, Math.floor((medState.endTime - Date.now()) / 1000))
                            setMedTime(remaining)
                            setMedActive(true)
                            setMedPaused(false)
                            if (remaining === 0) {
                                localStorage.removeItem(`med_state_${user.id}`)
                                handleClaim('meditation', 75, 'Mindful Minutes')
                                setMedActive(false)
                            }
                        } else if (medState.paused) {
                            setMedTime(medState.remaining)
                            setMedActive(true)
                            setMedPaused(true)
                        } else {
                            setMedTime(MED_DURATION)
                            setMedActive(false)
                        }
                    } else {
                        localStorage.removeItem(`med_state_${user.id}`)
                    }
                }
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [user, claimedChallenges])

    // Expose handleClaim to the interval
    const handleClaim = async (challengeId: string, customXp: number, name: string) => {
        try {
            // First update claims array so React picks it up
            const newClaims = [...claimedChallenges, challengeId]
            setClaimedChallenges(newClaims)
            localStorage.setItem(`claimed_challenges_${user.id}`, JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                claims: newClaims
            }))

            setXp(prevXp => {
                const newXp = prevXp + customXp
                const newLevel = newXp >= (level * 1000) ? level + 1 : level

                // Fire and forget the DB update
                supabase.from('user_gamification')
                    .update({ total_xp: newXp, current_level: newLevel })
                    .eq('user_id', user.id)
                    .then(({ error }) => {
                        if (error) console.error("Error updating XP", error)
                    })

                if (newLevel > level) {
                    setLevel(newLevel)
                    toast.success(`Level Up! You are now level ${newLevel}!`)
                }

                toast.success(`Claimed ${customXp} XP for ${name}!`)
                return newXp
            })

        } catch (error) {
            console.error("Failed to claim reward", error)
        }
    }

    const startWalk = () => {
        setWalkActive(true)
        const endTime = Date.now() + (WALK_DURATION * 1000)
        localStorage.setItem(`walk_end_${user.id}`, endTime.toString())
    }

    const startMeditation = () => {
        const endTime = Date.now() + (medTime * 1000)
        const state = { active: true, paused: false, endTime, remaining: medTime, date: new Date().toISOString().split('T')[0] }
        localStorage.setItem(`med_state_${user.id}`, JSON.stringify(state))
        setMedActive(true)
        setMedPaused(false)
    }

    const pauseMeditation = () => {
        const state = { active: true, paused: true, endTime: null, remaining: medTime, date: new Date().toISOString().split('T')[0] }
        localStorage.setItem(`med_state_${user.id}`, JSON.stringify(state))
        setMedPaused(true)
    }

    const stopMeditation = () => {
        const state = { active: false, paused: false, endTime: null, remaining: MED_DURATION, date: new Date().toISOString().split('T')[0] }
        localStorage.setItem(`med_state_${user.id}`, JSON.stringify(state))
        setMedActive(false)
        setMedPaused(false)
        setMedTime(MED_DURATION)
    }

    const addWater = () => {
        const newCount = waterCount + 1
        setWaterCount(newCount)
        localStorage.setItem(`water_count_${user.id}`, JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            count: newCount
        }))
        if (newCount === 8 && !claimedChallenges.includes('hydration')) {
            handleClaim('hydration', 50, 'Hydration Goal')
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-8 pb-20">

            {/* Level Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy className="h-32 w-32 rotate-12" />
                    </div>
                    <CardContent className="p-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">

                            <div className="relative shrink-0 flex items-center justify-center">
                                <svg className="h-32 w-32 -rotate-90">
                                    <circle cx="64" cy="64" r="60" className="stroke-muted fill-none" strokeWidth="8" />
                                    <circle cx="64" cy="64" r="60" className="stroke-primary fill-none transition-all duration-1000 ease-in-out" strokeWidth="8" strokeDasharray="377" strokeDashoffset={377 - (377 * (xp / nextLevelXp))} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Level</span>
                                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-primary/60">{level}</span>
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-bold mb-2">Health Champion</h2>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto md:mx-0">
                                    Build consistent habits by completing daily challenges. Keep up the great work!
                                </p>
                                <div className="flex items-center gap-4 justify-center md:justify-start">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium text-sm">
                                        <Flame className="h-4 w-4" /> {streak} Day Streak
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-muted-foreground font-medium text-sm">
                                        {xp} / {nextLevelXp} XP
                                    </div>
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Daily Challenges */}
            <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Daily Challenges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">

                    {/* Challenge 1: 30 Minute Walk */}
                    <Card className="hover:border-primary/50 transition-colors cursor-default">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base flex items-center gap-2"><Footprints className="h-4 w-4 text-emerald-500" /> 30 Minute Walk</CardTitle>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">+50 XP</Badge>
                            </div>
                            <CardDescription>Complete a 30 minute walk</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={claimedChallenges.includes('walk') ? 100 : (1 - walkTime / WALK_DURATION) * 100} className="h-2 mb-4 [&>div]:bg-emerald-500" />

                            {claimedChallenges.includes('walk') ? (
                                <Button size="sm" variant="secondary" className="w-full" disabled>Completed</Button>
                            ) : walkActive ? (
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-2xl font-mono text-emerald-600 dark:text-emerald-400">{formatTime(walkTime)}</span>
                                    <Badge variant="outline" className="animate-pulse border-emerald-500 text-emerald-600">Walking...</Badge>
                                </div>
                            ) : (
                                <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={startWalk}>
                                    <Play className="h-4 w-4 mr-2" /> Start Walk
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Challenge 2: Meds On Time */}
                    <Card className="hover:border-primary/50 transition-colors cursor-default">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Meds On Time</CardTitle>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">+100 XP</Badge>
                            </div>
                            <CardDescription>Log all medications within 1 hour of scheduled time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={50} className="h-2 mb-2 [&>div]:bg-amber-500" />
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                <span>In Progress</span>
                                <span className="font-medium text-foreground">1 / 2 Meds</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Challenge 3: Mindful Minutes */}
                    <Card className="hover:border-primary/50 transition-colors cursor-default">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-purple-500" /> Mindful Minutes</CardTitle>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">+75 XP</Badge>
                            </div>
                            <CardDescription>Complete a 10 minute meditation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={claimedChallenges.includes('meditation') ? 100 : (1 - medTime / MED_DURATION) * 100} className="h-2 mb-4 [&>div]:bg-purple-500" />

                            {claimedChallenges.includes('meditation') ? (
                                <Button size="sm" variant="secondary" className="w-full" disabled>Completed</Button>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {medActive ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-mono text-purple-600 dark:text-purple-400">{formatTime(medTime)}</span>
                                            <div className="flex gap-2">
                                                {medPaused ? (
                                                    <Button size="icon" variant="outline" className="border-purple-200 hover:bg-purple-50" onClick={startMeditation}><Play className="h-4 w-4 text-purple-600" /></Button>
                                                ) : (
                                                    <Button size="icon" variant="outline" className="border-purple-200 hover:bg-purple-50" onClick={pauseMeditation}><Pause className="h-4 w-4 text-purple-600" /></Button>
                                                )}
                                                <Button size="icon" variant="outline" onClick={stopMeditation}><Square className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button size="sm" className="w-full bg-purple-500 hover:bg-purple-600 text-white" onClick={startMeditation}>
                                            <Play className="h-4 w-4 mr-2" /> Start Meditation
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Challenge 4: Hydration Goal */}
                    <Card className="hover:border-primary/50 transition-colors cursor-default">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" /> Hydration Goal</CardTitle>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">+50 XP</Badge>
                            </div>
                            <CardDescription>Drink at least 8 glasses of water today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={Math.min((waterCount / 8) * 100, 100)} className="h-2 mb-4 [&>div]:bg-blue-500" />

                            {claimedChallenges.includes('hydration') ? (
                                <Button size="sm" variant="secondary" className="w-full" disabled>Completed (8/8)</Button>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="font-medium text-foreground text-sm">{waterCount} / 8 Glasses</span>
                                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={addWater}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Glass
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Badges & Achievements (Filtered) */}
            <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" /> Earned Badges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {AVAILABLE_ACHIEVEMENTS.map((ach, i) => {
                        const isUnlocked = unlockedKeys.includes(ach.key)
                        return (
                            <motion.div
                                key={ach.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className={`h-full border-2 ${isUnlocked ? ach.border : 'border-dashed border-muted bg-muted/20 opacity-70'} transition-all`}>
                                    <CardHeader className="text-center pb-2">
                                        <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-2 ${isUnlocked ? ach.bg : 'bg-muted'}`}>
                                            <ach.icon className={`h-8 w-8 ${isUnlocked ? ach.color : 'text-muted-foreground'}`} />
                                        </div>
                                        <CardTitle className="text-base">{ach.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center pb-4">
                                        <p className="text-xs text-muted-foreground mb-3">{ach.description}</p>
                                        {!isUnlocked && ach.progress !== undefined && (
                                            <div className="w-full max-w-[120px] mx-auto">
                                                <Progress value={ach.progress} className="h-1.5" />
                                                <span className="text-[10px] text-muted-foreground mt-1 block">{ach.progress}% complete</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}
