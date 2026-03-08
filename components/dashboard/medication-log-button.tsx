'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { MedicationLog } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MedicationLogButtonProps {
  log: MedicationLog
}

export function MedicationLogButton({ log }: MedicationLogButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLog = async (status: 'taken' | 'skipped') => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('medication_logs')
      .update({
        status,
        taken_at: status === 'taken' ? new Date().toISOString() : null,
      })
      .eq('id', log.id)

    if (error) {
      toast.error('Failed to log medication')
      setLoading(false)
      return
    }

    toast.success(status === 'taken' ? 'Medication taken!' : 'Medication skipped')
    router.refresh()
    setLoading(false)
  }

  if (log.status !== 'pending') {
    return (
      <div className="flex items-center gap-1">
        {log.status === 'taken' ? (
          <Check className="h-4 w-4 text-[var(--success)]" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground capitalize">{log.status}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => handleLog('skipped')}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          className="h-8 px-3"
          onClick={() => handleLog('taken')}
          disabled={loading}
        >
          {loading ? (
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Take
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}
