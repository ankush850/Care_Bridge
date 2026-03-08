'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User as UserIcon,
  Phone,
  AlertTriangle,
  Droplet,
  Shield,
  Mail,
  Save,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { EmergencyContactsManager } from './emergency-contacts-manager'

interface SettingsViewProps {
  user: User
  profile: Profile
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']

export function SettingsView({ user, profile: initialProfile }: SettingsViewProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Form state
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth || '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '')
  const [emergencyName, setEmergencyName] = useState(profile.emergency_contact_name || '')
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergency_contact_phone || '')
  const [bloodType, setBloodType] = useState(profile.blood_type || '')
  const [conditions, setConditions] = useState<string[]>(profile.medical_conditions || [])
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || [])
  const [newCondition, setNewCondition] = useState('')
  const [newAllergy, setNewAllergy] = useState('')

  const handleSaveProfile = async () => {
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        date_of_birth: dateOfBirth || null,
        phone_number: phoneNumber || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
        blood_type: bloodType || null,
        medical_conditions: conditions.length > 0 ? conditions : null,
        allergies: allergies.length > 0 ? allergies : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to save profile')
      setLoading(false)
      return
    }

    toast.success('Profile saved successfully')
    setLoading(false)
    router.refresh()
  }

  const addCondition = () => {
    if (newCondition && !conditions.includes(newCondition)) {
      setConditions([...conditions, newCondition])
      setNewCondition('')
    }
  }

  const removeCondition = (condition: string) => {
    setConditions(conditions.filter(c => c !== condition))
  }

  const addAllergy = () => {
    if (newAllergy && !allergies.includes(newAllergy)) {
      setAllergies([...allergies, newAllergy])
      setNewAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="h-5 w-5" />
                  Blood Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === 'unknown' ? "I don't know" : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Medical Conditions
                </CardTitle>
                <CardDescription>List any chronic conditions or diseases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition) => (
                    <Badge key={condition} variant="secondary" className="flex items-center gap-1">
                      {condition}
                      <button onClick={() => removeCondition(condition)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {conditions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No conditions added</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add condition..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button variant="outline" onClick={addCondition}>Add</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Allergies
                </CardTitle>
                <CardDescription>List any known allergies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <Badge key={allergy} variant="destructive" className="flex items-center gap-1">
                      {allergy}
                      <button onClick={() => removeAllergy(allergy)} className="ml-1 hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {allergies.length === 0 && (
                    <p className="text-sm text-muted-foreground">No allergies added</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add allergy..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                  />
                  <Button variant="outline" onClick={addAllergy}>Add</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="emergency">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmergencyContactsManager userId={user.id} />
          </motion.div>
        </TabsContent>

        <TabsContent value="account">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Input value={user.email || ''} disabled className="bg-muted" />
                    <Badge variant="outline">Verified</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" disabled>
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
