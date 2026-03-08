'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import type { Profile, Notification } from '@/lib/types'
import { Bell, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'

interface HeaderProps {
  user: User
  profile: Profile
}

const fetcher = async () => {
  const supabase = createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}

export function DashboardHeader({ profile }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: notifications = [], mutate } = useSWR<Notification[]>('notifications', fetcher, {
    refreshInterval: 30000,
  })

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center gap-4 pl-12 lg:pl-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {getGreeting()}, {profile.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative"
              >
                <Input
                  placeholder="Search..."
                  className="pr-8"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="font-semibold">Notifications</span>
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
