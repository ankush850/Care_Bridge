'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

const fetcher = async (): Promise<Notification[]> => {
  const supabase = createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export function useNotifications() {
  const { data: notifications = [], mutate, isLoading } = useSWR<Notification[]>(
    'all-notifications',
    fetcher,
    { refreshInterval: 30000 }
  )

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    mutate()
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('read', false)
    mutate()
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    mutate()
  }

  const createNotification = async (notification: {
    type: 'medication' | 'appointment' | 'health_alert' | 'system'
    title: string
    message: string
    action_url?: string
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('notifications').insert({
      ...notification,
      user_id: user.id,
    })
    mutate()
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refresh: mutate,
  }
}
