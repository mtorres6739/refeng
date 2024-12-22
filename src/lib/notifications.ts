import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });

    // TODO: Emit websocket event for real-time updates
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Helper function to create a new referral notification
export async function createReferralNotification({
  userId,
  referralId,
  referralName,
}: {
  userId: string;
  referralId: string;
  referralName: string;
}) {
  return createNotification({
    userId,
    type: NotificationType.NEW_REFERRAL,
    title: 'New Referral',
    message: `New referral received: ${referralName}`,
    data: { referralId },
  });
}

// Helper function to create a new message notification
export async function createMessageNotification({
  userId,
  referralId,
  referralName,
  messageId,
  messagePreview,
}: {
  userId: string;
  referralId: string;
  referralName: string;
  messageId: string;
  messagePreview: string;
}) {
  return createNotification({
    userId,
    type: NotificationType.NEW_MESSAGE,
    title: 'New Message',
    message: `New message on referral ${referralName}: ${messagePreview}`,
    data: { referralId, messageId },
  });
}

// Helper function to create a status change notification
export async function createStatusChangeNotification({
  userId,
  referralId,
  referralName,
  newStatus,
}: {
  userId: string;
  referralId: string;
  referralName: string;
  newStatus: string;
}) {
  return createNotification({
    userId,
    type: NotificationType.STATUS_CHANGE,
    title: 'Status Changed',
    message: `Referral ${referralName} status changed to ${newStatus}`,
    data: { referralId },
  });
}

// Helper function to create a points awarded notification
export async function createPointsAwardedNotification({
  userId,
  referralId,
  referralName,
  points,
}: {
  userId: string;
  referralId: string;
  referralName: string;
  points: number;
}) {
  return createNotification({
    userId,
    type: NotificationType.POINTS_AWARDED,
    title: 'Points Awarded',
    message: `You earned ${points} points for referral ${referralName}`,
    data: { referralId, points },
  });
}

// Helper function to create a drawing win notification
export async function createDrawingWinNotification({
  userId,
  drawingId,
  drawingName,
  prize,
}: {
  userId: string;
  drawingId: string;
  drawingName: string;
  prize: string;
}) {
  return createNotification({
    userId,
    type: NotificationType.DRAWING_WIN,
    title: 'Drawing Win',
    message: `Congratulations! You won ${prize} in the ${drawingName} drawing!`,
    data: { drawingId },
  });
}
