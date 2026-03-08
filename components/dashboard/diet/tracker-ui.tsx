'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Droplet, Flame, Apple, Plus, Coffee, Utensils, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Meal {
    id: string
    food_name: string
    meal_type: string
    calories: number
    logged_at: string
}

export function DietTrackerUI({ user }: { user: any }) {
    const [waterGlasses, setWaterGlasses] = useState(0)
    const [calories, setCalories] = useState(0)
    const [meals, setMeals] = useState<Meal[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [quickAddName, setQuickAddName] = useState('')
    const [quickAddCals, setQuickAddCals] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const supabase = createClient()

    const GOAL_WATER = 8
    const GOAL_CALS = 2200

    // Fetch today's data on mount
    useEffect(() => {
        const fetchTodayData = async () => {
            setIsLoading(true)
            const todayDate = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
            const startOfDay = `${todayDate}T00:00:00.000Z`

            try {
                // Fetch Hydration
                const { data: hydrationData } = await supabase
                    .from('hydration_logs')
                    .select('glasses')
                    .eq('user_id', user.id)
                    .eq('logged_date', todayDate)
                    .maybeSingle()

                if (hydrationData) {
                    setWaterGlasses(hydrationData.glasses)
                }

                // Fetch Meals
                const { data: dietData } = await supabase
                    .from('diet_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('logged_at', startOfDay)
                    .order('logged_at', { ascending: false })

                if (dietData) {
                    setMeals(dietData)
                    setCalories(dietData.reduce((acc, meal) => acc + (meal.calories || 0), 0))
                }

            } catch (error) {
                console.error("Error fetching diet data:", error)
                toast.error('Failed to load today\'s diet data')
            } finally {
                setIsLoading(false)
            }
        }

        if (user?.id) fetchTodayData()
    }, [user, supabase])

    const handleAddWater = async () => {
        const todayDate = new Date().toISOString().split('T')[0]
        const newGlasses = waterGlasses + 1

        // Optimistic update
        setWaterGlasses(newGlasses)

        try {
            const { error } = await supabase
                .from('hydration_logs')
                .upsert({
                    user_id: user.id,
                    logged_date: todayDate,
                    glasses: newGlasses
                }, { onConflict: 'user_id,logged_date' })

            if (error) throw error

            if (newGlasses === GOAL_WATER) {
                toast.success('Daily water goal reached!', { icon: '🎉' })
            } else {
                toast.success('Hydration logged!', { icon: '💧' })
            }
        } catch (error) {
            // Revert on failure
            setWaterGlasses(waterGlasses)
            toast.error('Failed to log water')
        }
    }

    const handleAddMeal = async () => {
        if (!quickAddName || !quickAddCals) return
        setIsSubmitting(true)

        const cals = parseInt(quickAddCals)

        try {
            const { data, error } = await supabase
                .from('diet_logs')
                .insert({
                    user_id: user.id,
                    food_name: quickAddName,
                    calories: cals,
                    meal_type: 'Snack' // Defaulting to snack for quick add
                })
                .select()
                .single()

            if (error) throw error

            setMeals(prev => [data, ...prev])
            setCalories(prev => prev + cals)
            setQuickAddName('')
            setQuickAddCals('')
            toast.success("Added to log!")
        } catch (error) {
            toast.error("Failed to add meal")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
            {/* Daily Summary Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calories Card */}
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-900 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Calories Eaten</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{calories}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {Math.max(0, GOAL_CALS - calories)} kcal remaining today
                        </p>
                        <Progress value={Math.min(100, (calories / GOAL_CALS) * 100)} className="h-2 mt-4 bg-orange-100 dark:bg-orange-950">
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (calories / GOAL_CALS) * 100)}%` }}
                            />
                        </Progress>
                    </CardContent>
                </Card>

                {/* Hydration Card */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-900 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Hydration</CardTitle>
                        <Droplet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-3xl font-bold">{waterGlasses}</span>
                                <span className="text-muted-foreground ml-1">/ {GOAL_WATER} glasses</span>
                            </div>
                            <Button size="icon" variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 disabled:opacity-50" onClick={handleAddWater}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex gap-1 mt-4 flex-wrap">
                            {Array.from({ length: Math.max(GOAL_WATER, waterGlasses) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex-1 min-w-[10%] h-3 rounded-full transition-colors",
                                        i < waterGlasses ? "bg-blue-500" : "bg-blue-100 dark:bg-blue-950"
                                    )}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Meals Log */}
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Today's Log</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Your meals for today</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {meals.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-xl">
                                No meals logged today yet.
                            </div>
                        ) : (
                            <AnimatePresence>
                                {meals.map((meal, i) => (
                                    <motion.div
                                        key={meal.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                {meal.meal_type === 'Breakfast' ? <Coffee className="h-5 w-5" /> : <Utensils className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{meal.food_name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {meal.meal_type} • {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="font-medium">{meal.calories} kcal</div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Add Log */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Add</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Food Name</label>
                        <Input
                            placeholder="e.g. Banana"
                            value={quickAddName}
                            onChange={e => setQuickAddName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estimated Calories</label>
                        <Input
                            type="number"
                            placeholder="e.g. 105"
                            value={quickAddCals}
                            onChange={e => setQuickAddCals(e.target.value)}
                        />
                    </div>
                    <Button
                        className="w-full mt-4"
                        onClick={handleAddMeal}
                        disabled={isSubmitting || !quickAddName || !quickAddCals}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Add to Diary
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
