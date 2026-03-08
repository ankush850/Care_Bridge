'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, Trash2, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function EmergencyContactsManager({ userId }: { userId: string }) {
    const [contacts, setContacts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)

    // New contact form
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [relationship, setRelationship] = useState('')

    const supabase = createClient()

    const fetchContacts = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error(error)
            toast.error('Failed to load emergency contacts')
        } else {
            setContacts(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchContacts()
    }, [userId])

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !email || !phone) {
            toast.error('Name, email, and phone are required')
            return
        }

        setIsAdding(true)
        const { error } = await supabase
            .from('emergency_contacts')
            .insert({
                user_id: userId,
                name,
                email,
                phone,
                relationship
            })

        if (error) {
            console.error(error)
            toast.error('Failed to add contact')
        } else {
            toast.success('Emergency contact added')
            setName('')
            setEmail('')
            setPhone('')
            setRelationship('')
            fetchContacts()
        }
        setIsAdding(false)
    }

    const handleDeleteContact = async (id: string) => {
        const { error } = await supabase
            .from('emergency_contacts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error(error)
            toast.error('Failed to remove contact')
        } else {
            toast.success('Contact removed')
            fetchContacts()
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-red-500" />
                    Emergency Contacts
                </CardTitle>
                <CardDescription>
                    These contacts will be saved for emergency references.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* List current contacts */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground border border-dashed">
                            No emergency contacts added yet.
                        </div>
                    ) : (
                        contacts.map(c => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border"
                            >
                                <div>
                                    <p className="font-semibold text-foreground">{c.name}</p>
                                    <p className="text-xs text-muted-foreground">{c.relationship && `${c.relationship} • `}{c.email} • {c.phone}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteContact(c.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Add new contact form */}
                <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-4 text-foreground/80 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add New Contact
                    </h4>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddContact}>
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Name *</Label>
                            <Input id="contactName" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Email *</Label>
                            <Input id="contactEmail" type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Phone Number *</Label>
                            <Input id="contactPhone" type="tel" placeholder="+1 (555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactRelation">Relationship</Label>
                            <Input id="contactRelation" placeholder="Partner, Parent, etc." value={relationship} onChange={e => setRelationship(e.target.value)} />
                        </div>

                        <div className="md:col-span-2 flex justify-end mt-2">
                            <Button type="submit" disabled={isAdding} className="w-full md:w-auto bg-primary hover:bg-primary/90">
                                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Contact
                            </Button>
                        </div>
                    </form>
                </div>

            </CardContent>
        </Card>
    )
}
