'use client';

import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Mock notifications for now - will be replaced with API call
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'job_reminder',
    title: 'Job Reminder',
    message: 'You have a job scheduled for tomorrow at 9:00 AM',
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'follow_up',
    title: 'Customer Follow-up',
    message: 'John Smith needs a follow-up call',
    read: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    type: 'payment_due',
    title: 'Payment Due',
    message: 'Invoice INV-00023 is overdue',
    read: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-3 p-4 transition-colors hover:bg-muted/50',
                    !notification.read && 'bg-muted/30'
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
