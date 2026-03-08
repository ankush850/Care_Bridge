'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isPast, isToday, isTomorrow, startOfDay, addDays } from 'date-fns'
import type { Appointment } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AppointmentsViewProps {
  appointments: Appointment[]
  userId: string
}

export function AppointmentsView({ appointments: initialAppointments, userId }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setTitle('')
    setDoctorName('')
    setLocation('')
    setDate(undefined)
    setTime('')
    setDuration('30')
    setNotes('')
    setEditingAppt(null)
  }

  const openEditDialog = (appt: Appointment) => {
    setEditingAppt(appt)
    setTitle(appt.title)
    setDoctorName(appt.doctor_name || '')
    setLocation(appt.location || '')
    const apptDate = new Date(appt.appointment_date)
    setDate(apptDate)
    setTime(format(apptDate, 'HH:mm'))
    setDuration(String(appt.duration_minutes))
    setNotes(appt.notes || '')
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) {
      toast.error('Please select date and time')
      return
    }
    setLoading(true)

    const [hours, minutes] = time.split(':').map(Number)
    const appointmentDate = new Date(date)
    appointmentDate.setHours(hours, minutes, 0, 0)

    const supabase = createClient()
    const appointmentData = {
      title,
      doctor_name: doctorName || null,
      location: location || null,
      appointment_date: appointmentDate.toISOString(),
      duration_minutes: Number(duration),
      notes: notes || null,
      user_id: userId,
      status: 'scheduled' as const,
    }

    if (editingAppt) {
      const { error } = await supabase
        .from('appointments')
        .update({ ...appointmentData, updated_at: new Date().toISOString() })
        .eq('id', editingAppt.id)

      if (error) {
        toast.error('Failed to update appointment')
        setLoading(false)
        return
      }

      toast.success('Appointment updated')
      setAppointments(appointments.map(a => a.id === editingAppt.id ? { ...a, ...appointmentData } : a))
    } else {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single()

      if (error) {
        toast.error('Failed to create appointment')
        setLoading(false)
        return
      }

      toast.success('Appointment scheduled')
      setAppointments([...appointments, data].sort((a, b) => 
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      ))
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
      .from('appointments')
      .delete()
      .eq('id', deleteId)

    if (error) {
      toast.error('Failed to delete appointment')
      setLoading(false)
      return
    }

    toast.success('Appointment deleted')
    setAppointments(appointments.filter(a => a.id !== deleteId))
    setDeleteId(null)
    setLoading(false)
    router.refresh()
  }

  const updateStatus = async (id: string, status: 'completed' | 'cancelled') => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update appointment')
      return
    }

    toast.success(`Appointment marked as ${status}`)
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a))
    router.refresh()
  }

  const formatAppointmentDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`
    if (isTomorrow(d)) return `Tomorrow at ${format(d, 'h:mm a')}`
    return format(d, 'MMM d, yyyy \'at\' h:mm a')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>
      case 'completed':
        return <Badge className="bg-[var(--success)] text-[var(--success-foreground)]">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'rescheduled':
        return <Badge variant="secondary">Rescheduled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const upcomingAppointments = appointments.filter(a => 
    a.status === 'scheduled' && !isPast(new Date(a.appointment_date))
  )
  const pastAppointments = appointments.filter(a => 
    a.status !== 'scheduled' || isPast(new Date(a.appointment_date))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Schedule and manage your medical visits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAppt ? 'Edit Appointment' : 'Schedule Appointment'}</DialogTitle>
              <DialogDescription>
                {editingAppt ? 'Update appointment details' : 'Add a new medical appointment'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Appointment Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Annual Checkup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor Name</Label>
                <Input
                  id="doctor"
                  placeholder="e.g., Dr. Smith"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., City Medical Center"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < startOfDay(new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !title || !date || !time}>
                  {loading ? 'Saving...' : editingAppt ? 'Update' : 'Schedule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
          <CardDescription>{upcomingAppointments.length} scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No upcoming appointments</p>
              <Button variant="link" onClick={() => setDialogOpen(true)}>
                Schedule your first appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {upcomingAppointments.map((appt) => (
                  <motion.div
                    key={appt.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full mt-1">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{appt.title}</h4>
                        {appt.doctor_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            Dr. {appt.doctor_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {formatAppointmentDate(appt.appointment_date)}
                          <span className="ml-2">({appt.duration_minutes} min)</span>
                        </div>
                        {appt.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {appt.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(appt.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(appt)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(appt.id, 'completed')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(appt.id, 'cancelled')}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(appt.id)}
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

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past & Completed</CardTitle>
            <CardDescription>{pastAppointments.length} appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastAppointments.slice(0, 10).map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg opacity-75"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{appt.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appt.appointment_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(appt.status)}
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(appt.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
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
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this appointment. This action cannot be undone.
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
