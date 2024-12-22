import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { NotificationType } from '@prisma/client';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data: any;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('Fetching notifications...');
      
      const response = await fetch('/api/notifications');
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      if (!Array.isArray(data)) {
        console.error('Invalid notifications data:', data);
        throw new Error('Invalid notifications data received');
      }
      
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      console.log('Marking notifications as read:', notificationIds);
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error marking as read:', errorData);
        throw new Error(errorData.error || 'Failed to mark notifications as read');
      }

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      // Don't throw here, just log the error
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.NEW_REFERRAL:
      case NotificationType.STATUS_CHANGE:
        router.push(`/dashboard/referrals/${notification.data.referralId}`);
        break;
      case NotificationType.NEW_MESSAGE:
        router.push(`/dashboard/referrals/${notification.data.referralId}?messageId=${notification.data.messageId}`);
        break;
      case NotificationType.DRAWING_WIN:
        router.push(`/dashboard/drawings/${notification.data.drawingId}`);
        break;
      default:
        break;
    }

    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-[10px] font-medium text-white grid place-items-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-500">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start gap-1 p-4 ${
                !notification.isRead ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex w-full justify-between gap-4">
                <span className="font-medium">{notification.title}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
