'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Heart, User, Phone, AlertTriangle, Droplet, ArrowRight, ArrowLeft, Check, X } from 'lucide-react'
import { toast } from 'sonner'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const COMMON_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Arthritis',
  'Depression',
  'Anxiety',
  'COPD',
]

const COMMON_ALLERGIES = [
  'Penicillin',
  'Sulfa drugs',
  'Aspirin',
  'Ibuprofen',
  'Latex',
  'Peanuts',
  'Shellfish',
  'Eggs',
]

interface StepProps {
  onNext: () => void
  onBack?: () => void
  isFirst?: boolean
  isLast?: boolean
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Form state
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])
  const [customCondition, setCustomCondition] = useState('')
  const [allergies, setAllergies] = useState<string[]>([])
  const [customAllergy, setCustomAllergy] = useState('')
  const [bloodType, setBloodType] = useState('')

  const handleComplete = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to continue')
      router.push('/auth/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        phone_number: phoneNumber || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
        medical_conditions: medicalConditions.length > 0 ? medicalConditions : null,
        allergies: allergies.length > 0 ? allergies : null,
        blood_type: bloodType || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to save profile')
      setLoading(false)
      return
    }

    toast.success('Profile setup complete!')
    router.push('/dashboard')
    router.refresh()
  }

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
      icon: User,
    },
    {
      title: 'Emergency Contact',
      description: 'Who should we contact in an emergency?',
      icon: Phone,
    },
    {
      title: 'Medical History',
      description: 'Help us understand your health background',
      icon: AlertTriangle,
    },
    {
      title: 'Additional Details',
      description: 'Almost there!',
      icon: Droplet,
    },
  ]

  const toggleCondition = (condition: string) => {
    setMedicalConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  const addCustomCondition = () => {
    if (customCondition && !medicalConditions.includes(customCondition)) {
      setMedicalConditions(prev => [...prev, customCondition])
      setCustomCondition('')
    }
  }

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev =>
      prev.includes(allergy)
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    )
  }

  const addCustomAllergy = () => {
    if (customAllergy && !allergies.includes(customAllergy)) {
      setAllergies(prev => [...prev, customAllergy])
      setCustomAllergy('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary rounded-lg">
            <Heart className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">CareBridge</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${i <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {i < step ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-24 h-1 mx-2 rounded transition-colors ${i < step ? 'bg-primary' : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">{steps[step].title}</CardTitle>
                <CardDescription>{steps[step].description}</CardDescription>
              </CardHeader>
              <CardContent>
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
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
                        placeholder="+1 (555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Contact Name</Label>
                      <Input
                        id="emergencyName"
                        placeholder="Jane Doe"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        placeholder="+1 (555) 987-6543"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This information will only be used in case of an emergency.
                    </p>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Medical Conditions</Label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_CONDITIONS.map((condition) => (
                          <Badge
                            key={condition}
                            variant={medicalConditions.includes(condition) ? 'default' : 'outline'}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleCondition(condition)}
                          >
                            {condition}
                            {medicalConditions.includes(condition) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add other condition..."
                          value={customCondition}
                          onChange={(e) => setCustomCondition(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomCondition()}
                        />
                        <Button type="button" variant="outline" onClick={addCustomCondition}>
                          Add
                        </Button>
                      </div>
                      {medicalConditions.filter(c => !COMMON_CONDITIONS.includes(c)).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {medicalConditions.filter(c => !COMMON_CONDITIONS.includes(c)).map((c) => (
                            <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => toggleCondition(c)}>
                              {c}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>Known Allergies</Label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_ALLERGIES.map((allergy) => (
                          <Badge
                            key={allergy}
                            variant={allergies.includes(allergy) ? 'destructive' : 'outline'}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleAllergy(allergy)}
                          >
                            {allergy}
                            {allergies.includes(allergy) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add other allergy..."
                          value={customAllergy}
                          onChange={(e) => setCustomAllergy(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomAllergy()}
                        />
                        <Button type="button" variant="outline" onClick={addCustomAllergy}>
                          Add
                        </Button>
                      </div>
                      {allergies.filter(a => !COMMON_ALLERGIES.includes(a)).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {allergies.filter(a => !COMMON_ALLERGIES.includes(a)).map((a) => (
                            <Badge key={a} variant="secondary" className="cursor-pointer" onClick={() => toggleAllergy(a)}>
                              {a}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Blood Type</Label>
                      <Select value={bloodType} onValueChange={setBloodType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                          <SelectItem value="unknown">I don{"'"}t know</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Profile Summary</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Name:</dt>
                          <dd>{fullName || 'Not provided'}</dd>
                        </div>
                        {dateOfBirth && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Date of Birth:</dt>
                            <dd>{new Date(dateOfBirth).toLocaleDateString()}</dd>
                          </div>
                        )}
                        {emergencyName && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Emergency Contact:</dt>
                            <dd>{emergencyName}</dd>
                          </div>
                        )}
                        {medicalConditions.length > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Conditions:</dt>
                            <dd>{medicalConditions.length} listed</dd>
                          </div>
                        )}
                        {allergies.length > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Allergies:</dt>
                            <dd>{allergies.length} listed</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  {step > 0 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < steps.length - 1 ? (
                    <Button
                      onClick={() => setStep(step + 1)}
                      disabled={step === 0 && !fullName}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleComplete} disabled={loading || !fullName}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Complete Setup
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Skip option */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={handleComplete}
            disabled={loading}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
