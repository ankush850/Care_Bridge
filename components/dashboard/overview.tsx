'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { format, isToday, isTomorrow } from 'date-fns'
import type { Medication, HealthMetric, Appointment, MedicationLog } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Pill,
  Activity,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Heart,
  Droplet,
  Thermometer,
} from 'lucide-react'
import { MedicationLogButton } from './medication-log-button'

interface OverviewProps {
  medications: Medication[]
  healthMetrics: HealthMetric[]
  appointments: Appointment[]
  medicationLogs: MedicationLog[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function DashboardOverview({
  medications,
  healthMetrics,
  appointments,
  medicationLogs,
}: OverviewProps) {
  // Calculate medication adherence
  const todayLogs = medicationLogs.filter(log => {
    const logDate = new Date(log.scheduled_time)
    return isToday(logDate)
  })
  const takenToday = todayLogs.filter(log => log.status === 'taken').length
  const totalToday = todayLogs.length
  const adherencePercent = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 100

  // Get latest health metrics by type
  const latestMetrics: Record<string, HealthMetric> = {}
  healthMetrics.forEach(metric => {
    if (!latestMetrics[metric.metric_type]) {
      latestMetrics[metric.metric_type] = metric
    }
  })

  // Get upcoming medications
  const now = new Date()
  const upcomingLogs = medicationLogs
    .filter(log => log.status === 'pending' && new Date(log.scheduled_time) > now)
    .slice(0, 3)

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'heart_rate':
        return Heart
      case 'blood_pressure':
        return Activity
      case 'blood_sugar':
        return Droplet
      case 'temperature':
        return Thermometer
      default:
        return TrendingUp
    }
  }

  const formatMetricValue = (metric: HealthMetric) => {
    const value = metric.value as Record<string, number>
    switch (metric.metric_type) {
      case 'blood_pressure':
        return `${value.systolic}/${value.diastolic} mmHg`
      case 'heart_rate':
        return `${value.bpm} bpm`
      case 'blood_sugar':
        return `${value.level} mg/dL`
      case 'weight':
        return `${value.weight} ${value.unit || 'kg'}`
      case 'temperature':
        return `${value.temp}°${value.unit || 'F'}`
      case 'oxygen_saturation':
        return `${value.spo2}%`
      default:
        return JSON.stringify(value)
    }
  }

  const formatAppointmentDate = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`
    if (isTomorrow(d)) return `Tomorrow at ${format(d, 'h:mm a')}`
    return format(d, 'MMM d at h:mm a')
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Medications</p>
                  <p className="text-3xl font-bold">{medications.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Pill className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <Link href="/dashboard/medications" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{"Today's Adherence"}</p>
                  <p className="text-3xl font-bold">{adherencePercent}%</p>
                </div>
                <div className="p-3 bg-[var(--success)]/10 rounded-full">
                  <CheckCircle className="h-6 w-6 text-[var(--success)]" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={adherencePercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Health Metrics</p>
                  <p className="text-3xl font-bold">{Object.keys(latestMetrics).length}</p>
                </div>
                <div className="p-3 bg-[var(--info)]/10 rounded-full">
                  <Activity className="h-6 w-6 text-[var(--info)]" />
                </div>
              </div>
              <div className="mt-4">
                <Link href="/dashboard/health" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Track metrics <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Appointments</p>
                  <p className="text-3xl font-bold">{appointments.length}</p>
                </div>
                <div className="p-3 bg-[var(--warning)]/10 rounded-full">
                  <Calendar className="h-6 w-6 text-[var(--warning)]" />
                </div>
              </div>
              <div className="mt-4">
                <Link href="/dashboard/appointments" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Schedule <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Medications */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Medications</CardTitle>
                <CardDescription>Your scheduled doses for today</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/medications">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No upcoming medications today</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/dashboard/medications">Add a medication</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Pill className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{log.medication?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.medication?.dosage}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.scheduled_time), 'h:mm a')}
                          </div>
                        </div>
                        <MedicationLogButton log={log} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Metrics Summary */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Health Metrics</CardTitle>
                <CardDescription>Latest readings</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/health">
                  <Plus className="h-4 w-4 mr-1" />
                  Log
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {Object.keys(latestMetrics).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No metrics recorded yet</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/dashboard/health">Start tracking</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.values(latestMetrics).slice(0, 4).map((metric) => {
                    const Icon = getMetricIcon(metric.metric_type)
                    return (
                      <div key={metric.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-full">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm capitalize">
                            {metric.metric_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatMetricValue(metric)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(metric.recorded_at), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Appointments Section */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled medical visits</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/appointments">
                <Plus className="h-4 w-4 mr-1" />
                Schedule
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No upcoming appointments</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/dashboard/appointments">Schedule one</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{appointment.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {appointment.status}
                      </Badge>
                    </div>
                    {appointment.doctor_name && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Dr. {appointment.doctor_name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatAppointmentDate(appointment.appointment_date)}
                    </div>
                    {appointment.location && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {appointment.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/medications">
                  <Pill className="h-5 w-5" />
                  <span className="text-xs">Add Medication</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/health">
                  <Activity className="h-5 w-5" />
                  <span className="text-xs">Log Metric</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/appointments">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">New Appointment</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/settings">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-xs">Emergency Info</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
