'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format, subDays } from 'date-fns'
import type { HealthMetric } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Activity,
  Heart,
  Droplet,
  Thermometer,
  Scale,
  Wind,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface HealthMetricsViewProps {
  metrics: HealthMetric[]
  userId: string
}

const METRIC_TYPES = [
  { value: 'blood_pressure', label: 'Blood Pressure', icon: Activity, unit: 'mmHg' },
  { value: 'heart_rate', label: 'Heart Rate', icon: Heart, unit: 'bpm' },
  { value: 'blood_sugar', label: 'Blood Sugar', icon: Droplet, unit: 'mg/dL' },
  { value: 'weight', label: 'Weight', icon: Scale, unit: 'kg' },
  { value: 'temperature', label: 'Temperature', icon: Thermometer, unit: 'F' },
  { value: 'oxygen_saturation', label: 'Oxygen Saturation', icon: Wind, unit: '%' },
]

export function HealthMetricsView({ metrics: initialMetrics, userId }: HealthMetricsViewProps) {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('blood_pressure')
  const router = useRouter()

  // Form state
  const [metricType, setMetricType] = useState<string>('blood_pressure')
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [bloodSugar, setBloodSugar] = useState('')
  const [weight, setWeight] = useState('')
  const [temperature, setTemperature] = useState('')
  const [oxygenSat, setOxygenSat] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setSystolic('')
    setDiastolic('')
    setHeartRate('')
    setBloodSugar('')
    setWeight('')
    setTemperature('')
    setOxygenSat('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let value: Record<string, number | string> = {}

    switch (metricType) {
      case 'blood_pressure':
        value = { systolic: Number(systolic), diastolic: Number(diastolic) }
        break
      case 'heart_rate':
        value = { bpm: Number(heartRate) }
        break
      case 'blood_sugar':
        value = { level: Number(bloodSugar) }
        break
      case 'weight':
        value = { weight: Number(weight), unit: 'kg' }
        break
      case 'temperature':
        value = { temp: Number(temperature), unit: 'F' }
        break
      case 'oxygen_saturation':
        value = { spo2: Number(oxygenSat) }
        break
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('health_metrics')
      .insert({
        user_id: userId,
        metric_type: metricType,
        value,
        notes: notes || null,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      toast.error(`Failed to log metric: ${error.message}`)
      console.error('Insert Error:', error)
      setLoading(false)
      return
    }

    toast.success('Metric logged successfully')
    setMetrics([data, ...metrics])
    setDialogOpen(false)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  // Get metrics for chart
  const getChartData = (type: string) => {
    const typeMetrics = metrics
      .filter(m => m.metric_type === type)
      .slice(0, 14)
      .reverse()

    return typeMetrics.map(m => {
      const value = m.value as Record<string, number>
      let displayValue: number

      switch (type) {
        case 'blood_pressure':
          displayValue = value.systolic
          break
        case 'heart_rate':
          displayValue = value.bpm
          break
        case 'blood_sugar':
          displayValue = value.level
          break
        case 'weight':
          displayValue = value.weight
          break
        case 'temperature':
          displayValue = value.temp
          break
        case 'oxygen_saturation':
          displayValue = value.spo2
          break
        default:
          displayValue = 0
      }

      return {
        date: format(new Date(m.recorded_at), 'MMM d'),
        value: displayValue,
        ...(type === 'blood_pressure' && { diastolic: value.diastolic }),
      }
    })
  }

  // Get latest reading and trend
  const getLatestAndTrend = (type: string) => {
    const typeMetrics = metrics.filter(m => m.metric_type === type)
    if (typeMetrics.length === 0) return { latest: null, trend: 'none' as const }

    const latest = typeMetrics[0]
    const previous = typeMetrics[1]

    if (!previous) return { latest, trend: 'none' as const }

    const latestValue = Object.values(latest.value as Record<string, number>)[0]
    const prevValue = Object.values(previous.value as Record<string, number>)[0]

    const trend = latestValue > prevValue ? 'up' : latestValue < prevValue ? 'down' : 'same'
    return { latest, trend: trend as 'up' | 'down' | 'same' | 'none' }
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
        return `${value.weight} kg`
      case 'temperature':
        return `${value.temp}°F`
      case 'oxygen_saturation':
        return `${value.spo2}%`
      default:
        return JSON.stringify(value)
    }
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'same' | 'none' }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-[var(--warning)]" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-[var(--success)]" />
      case 'same':
        return <Minus className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health Metrics</h1>
          <p className="text-muted-foreground">Track and monitor your vital signs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Metric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Health Metric</DialogTitle>
              <DialogDescription>Record your latest health measurement</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Metric Type</Label>
                <Select value={metricType} onValueChange={setMetricType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {metricType === 'blood_pressure' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Systolic (mmHg)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diastolic (mmHg)</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {metricType === 'heart_rate' && (
                <div className="space-y-2">
                  <Label>Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    required
                  />
                </div>
              )}

              {metricType === 'blood_sugar' && (
                <div className="space-y-2">
                  <Label>Blood Sugar (mg/dL)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    required
                  />
                </div>
              )}

              {metricType === 'weight' && (
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
              )}

              {metricType === 'temperature' && (
                <div className="space-y-2">
                  <Label>Temperature (°F)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    required
                  />
                </div>
              )}

              {metricType === 'oxygen_saturation' && (
                <div className="space-y-2">
                  <Label>SpO2 (%)</Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={oxygenSat}
                    onChange={(e) => setOxygenSat(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Logging...' : 'Log Metric'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRIC_TYPES.map((type) => {
          const { latest, trend } = getLatestAndTrend(type.value)
          return (
            <motion.div
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`cursor-pointer transition-shadow hover:shadow-md ${selectedType === type.value ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedType(type.value)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <type.icon className="h-5 w-5 text-primary" />
                    </div>
                    <TrendIcon trend={trend} />
                  </div>
                  <h3 className="font-medium text-muted-foreground text-sm">{type.label}</h3>
                  {latest ? (
                    <>
                      <p className="text-2xl font-bold mt-1">{formatMetricValue(latest)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(latest.recorded_at), 'MMM d, h:mm a')}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">No readings yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {METRIC_TYPES.find(t => t.value === selectedType)?.label} Trend
          </CardTitle>
          <CardDescription>Last 14 readings</CardDescription>
        </CardHeader>
        <CardContent>
          {getChartData(selectedType).length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available for this metric
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData(selectedType)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  {selectedType === 'blood_pressure' && (
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Readings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Readings</CardTitle>
          <CardDescription>All your health measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              {METRIC_TYPES.map((type) => (
                <TabsTrigger key={type.value} value={type.value} className="hidden md:flex">
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all">
              <div className="space-y-2">
                {metrics.slice(0, 10).map((metric) => {
                  const type = METRIC_TYPES.find(t => t.value === metric.metric_type)
                  const Icon = type?.icon || Activity
                  return (
                    <div key={metric.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-full">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{type?.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(metric.recorded_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">{formatMetricValue(metric)}</p>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
            {METRIC_TYPES.map((type) => (
              <TabsContent key={type.value} value={type.value}>
                <div className="space-y-2">
                  {metrics.filter(m => m.metric_type === type.value).slice(0, 10).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(metric.recorded_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className="font-medium">{formatMetricValue(metric)}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
