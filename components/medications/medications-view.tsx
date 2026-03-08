'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import type { Medication } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Pill, Plus, Clock, Calendar, Trash2, Edit, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MedicationsViewProps {
  medications: Medication[]
  userId: string
}

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (8 AM)' },
  { value: 'noon', label: 'Noon (12 PM)' },
  { value: 'afternoon', label: 'Afternoon (3 PM)' },
  { value: 'evening', label: 'Evening (6 PM)' },
  { value: 'night', label: 'Night (9 PM)' },
  { value: 'bedtime', label: 'Bedtime (10 PM)' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times', label: 'Three times daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As needed' },
]

export function MedicationsView({ medications: initialMedications, userId }: MedicationsViewProps) {
  const [medications, setMedications] = useState(initialMedications)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingMed, setEditingMed] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Form state
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [timeOfDay, setTimeOfDay] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [instructions, setInstructions] = useState('')

  const resetForm = () => {
    setName('')
    setDosage('')
    setFrequency('')
    setTimeOfDay([])
    setStartDate('')
    setEndDate('')
    setInstructions('')
    setEditingMed(null)
  }

  const openEditDialog = (med: Medication) => {
    setEditingMed(med)
    setName(med.name)
    setDosage(med.dosage)
    setFrequency(med.frequency)
    setTimeOfDay(med.time_of_day)
    setStartDate(med.start_date)
    setEndDate(med.end_date || '')
    setInstructions(med.instructions || '')
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const medicationData = {
      name,
      dosage,
      frequency,
      time_of_day: timeOfDay,
      start_date: startDate,
      end_date: endDate || null,
      instructions: instructions || null,
      user_id: userId,
      is_active: true,
    }

    if (editingMed) {
      const { error } = await supabase
        .from('medications')
        .update({ ...medicationData, updated_at: new Date().toISOString() })
        .eq('id', editingMed.id)

      if (error) {
        toast.error('Failed to update medication')
        setLoading(false)
        return
      }

      toast.success('Medication updated')
      setMedications(medications.map(m => m.id === editingMed.id ? { ...m, ...medicationData } : m))
    } else {
      const { data, error } = await supabase
        .from('medications')
        .insert(medicationData)
        .select()
        .single()

      if (error) {
        toast.error(`Failed to add medication: ${error.message}`)
        console.error('Insert Error:', error)
        setLoading(false)
        return
      }

      toast.success('Medication added')
      setMedications([data, ...medications])
    }

    setDialogOpen(false)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', deleteId)

    if (error) {
      toast.error('Failed to delete medication')
      setLoading(false)
      return
    }

    toast.success('Medication deleted')
    setMedications(medications.filter(m => m.id !== deleteId))
    setDeleteId(null)
    setLoading(false)
    router.refresh()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('medications')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update medication')
      return
    }

    toast.success(isActive ? 'Medication paused' : 'Medication activated')
    setMedications(medications.map(m => m.id === id ? { ...m, is_active: !isActive } : m))
    router.refresh()
  }

  const toggleTime = (time: string) => {
    setTimeOfDay(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    )
  }

  const activeMeds = medications.filter(m => m.is_active)
  const inactiveMeds = medications.filter(m => !m.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medications</h1>
          <p className="text-muted-foreground">Manage your medications and schedules</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMed ? 'Edit Medication' : 'Add New Medication'}</DialogTitle>
              <DialogDescription>
                {editingMed ? 'Update medication details' : 'Enter the details of your medication'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medication Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Lisinopril"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 10mg"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency *</Label>
                <Select value={frequency} onValueChange={setFrequency} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time of Day *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={opt.value}
                        checked={timeOfDay.includes(opt.value)}
                        onCheckedChange={() => toggleTime(opt.value)}
                      />
                      <label htmlFor={opt.value} className="text-sm cursor-pointer">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="e.g., Take with food"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name || !dosage || !frequency || timeOfDay.length === 0 || !startDate}>
                  {loading ? 'Saving...' : editingMed ? 'Update' : 'Add Medication'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Medications</CardTitle>
          <CardDescription>{activeMeds.length} medications</CardDescription>
        </CardHeader>
        <CardContent>
          {activeMeds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No active medications</p>
              <Button variant="link" onClick={() => setDialogOpen(true)}>
                Add your first medication
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activeMeds.map((med) => (
                  <motion.div
                    key={med.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{med.name}</h4>
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {med.time_of_day.join(', ')}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Started {format(new Date(med.start_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {FREQUENCY_OPTIONS.find(f => f.value === med.frequency)?.label || med.frequency}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(med)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(med.id, med.is_active)}>
                            <Clock className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(med.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Medications */}
      {inactiveMeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paused Medications</CardTitle>
            <CardDescription>{inactiveMeds.length} medications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveMeds.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      <Pill className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{med.name}</h4>
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(med.id, med.is_active)}>
                      Reactivate
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(med.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this medication and all its logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
