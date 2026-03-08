'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '@/hooks/use-notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Pill,
  Calendar,
  AlertTriangle,
  Settings,
  Trash2,
  Check,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'medication':
      return Pill
    case 'appointment':
      return Calendar
    case 'health_alert':
      return AlertTriangle
    case 'system':
      return Settings
    default:
      return Bell
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'medication':
      return 'text-primary bg-primary/10'
    case 'appointment':
      return 'text-[var(--warning)] bg-[var(--warning)]/10'
    case 'health_alert':
      return 'text-destructive bg-destructive/10'
    case 'system':
      return 'text-muted-foreground bg-muted'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications()

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {"You're all caught up! Notifications will appear here when you have new updates."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge>{unreadCount}</Badge>
                  Unread
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <AnimatePresence>
                    {unreadNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type)
                      const colorClass = getNotificationColor(notification.type)
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary"
                        >
                          <div className={cn('p-2 rounded-full', colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{notification.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {notification.action_url && (
                                <Button asChild size="sm" variant="outline">
                                  <Link href={notification.action_url}>View</Link>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark as read
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earlier</CardTitle>
                <CardDescription>{readNotifications.length} notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {readNotifications.slice(0, 20).map((notification) => {
                    const Icon = getNotificationIcon(notification.type)
                    const colorClass = getNotificationColor(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg opacity-75"
                      >
                        <div className={cn('p-2 rounded-full', colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
