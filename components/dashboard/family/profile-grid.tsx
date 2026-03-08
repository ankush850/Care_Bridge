'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, User, Activity, Pill, Calendar, Heart, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function ProfileGrid({ mainProfile }: { mainProfile: any }) {
    const [dependants, setDependants] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state for new dependant
    const [newName, setNewName] = useState('')
    const [newRelation, setNewRelation] = useState('')
    const [newDob, setNewDob] = useState('')

    const supabase = createClient()

    useEffect(() => {
        const fetchDependants = async () => {
            if (!mainProfile?.id) return
            setIsLoading(true)

            try {
                const { data, error } = await supabase
                    .from('dependants')
                    .select('*')
                    .eq('primary_user_id', mainProfile.id)
                    .order('created_at', { ascending: true })

                if (error) throw error
                if (data) setDependants(data)
            } catch (error) {
                console.error("Failed to load dependants", error)
                toast.error("Failed to load family profiles")
            } finally {
                setIsLoading(false)
            }
        }

        fetchDependants()
    }, [mainProfile, supabase])

    const handleAddDependant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName || !newRelation) return

        setIsSubmitting(true)
        const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500']
        const randomColor = colors[Math.floor(Math.random() * colors.length)]

        try {
            const { data, error } = await supabase
                .from('dependants')
                .insert({
                    primary_user_id: mainProfile.id,
                    full_name: newName,
                    relationship: newRelation,
                    date_of_birth: newDob || null,
                    avatar_color: randomColor
                })
                .select()
                .single()

            if (error) throw error

            setDependants([...dependants, data])
            toast.success("Profile added successfully!")
            setNewName('')
            setNewRelation('')
            setNewDob('')
            setIsDialogOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Failed to create profile")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">

            {/* Main Account Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="h-full border-primary/20 bg-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge className="bg-primary">Primary Account</Badge>
                    </div>
                    <CardHeader className="pt-8">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-sm mb-4">
                            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                                {mainProfile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">{mainProfile?.full_name || 'Your Profile'}</CardTitle>
                        <p className="text-muted-foreground">Self</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 bg-background rounded-xl border items-center text-center">
                                <Activity className="h-4 w-4 text-emerald-500 mb-1" />
                                <span className="text-sm font-medium">Health</span>
                                <span className="text-xs text-muted-foreground">Good</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-background rounded-xl border items-center text-center">
                                <Pill className="h-4 w-4 text-orange-500 mb-1" />
                                <span className="text-sm font-medium">Meds</span>
                                <span className="text-xs text-muted-foreground">On Track</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">View Dashboard</Button>
                    </CardFooter>
                </Card>
            </motion.div>

            {/* Dependant Cards */}
            <AnimatePresence>
                {dependants.map((dep, i) => (
                    <motion.div
                        key={dep.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="h-full"
                    >
                        <Card className="h-full relative hover:shadow-md transition-shadow flex flex-col">
                            {/* <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-destructive animate-pulse" /> */}
                            <CardHeader className="pt-8 flex-1">
                                <Avatar className="h-20 w-20 border-4 border-background shadow-sm mb-4">
                                    <AvatarFallback className={`${dep.avatar_color}/10 ${dep.avatar_color.replace('bg-', 'text-')} text-2xl font-semibold`}>
                                        {dep.full_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-xl">{dep.full_name}</CardTitle>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <span>{dep.relationship}</span>
                                    {dep.date_of_birth && (
                                        <>
                                            <span>•</span>
                                            <span>Born {new Date(dep.date_of_birth).getFullYear()}</span>
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Pill className="h-4 w-4 text-muted-foreground" />
                                            <span>Active Meds</span>
                                        </div>
                                        <span className="font-medium">0</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Next Appt</span>
                                        </div>
                                        <span className="font-medium text-xs">None scheduled</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button className="w-full">Manage</Button>
                                <Button size="icon" variant="outline"><Heart className="h-4 w-4" /></Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Add New Profile Card */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full"
                    >
                        <Card className="h-full border-dashed bg-transparent hover:bg-muted/50 transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[350px]">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
                                <Plus className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-xl">Add Profile</CardTitle>
                            <p className="text-muted-foreground text-sm mt-2 text-center max-w-[200px]">
                                Add a family member or dependant to manage their care.
                            </p>
                        </Card>
                    </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Family Member</DialogTitle>
                        <DialogDescription>
                            Create a profile for someone you care for to manage their health records centrally.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddDependant} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Eleanor Smith"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="relation">Relationship</Label>
                            <Input
                                id="relation"
                                placeholder="e.g. Mother, Child, Spouse"
                                value={newRelation}
                                onChange={e => setNewRelation(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth (Optional)</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={newDob}
                                onChange={e => setNewDob(e.target.value)}
                            />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="submit" disabled={isSubmitting || !newName || !newRelation} className="w-full">
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Create Profile
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    )
}
