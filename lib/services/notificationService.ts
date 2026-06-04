import mongoose from 'mongoose';
import { Notification } from '@/models';

interface CreateNotificationOptions {
  companyId: string;
  userId: string;
  title: string;
  description: string;
  type?:
    | 'lead'
    | 'deal'
    | 'project'
    | 'task'
    | 'invoice'
    | 'payment'
    | 'attendance'
    | 'system'
    | 'mention'
    | 'approval';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  link?: string;
}

export async function createNotification(options: CreateNotificationOptions) {
  try {
    const notif = new Notification({
      companyId: new mongoose.Types.ObjectId(options.companyId),
      userId: new mongoose.Types.ObjectId(options.userId),
      title: options.title,
      description: options.description,
      type: options.type || 'system',
      priority: options.priority || 'normal',
      link: options.link,
    });
    await notif.save();
    return notif;
  } catch (error) {
    console.error('Failed to create notification', error);
  }
}
