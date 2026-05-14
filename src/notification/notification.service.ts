import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../websocket/entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifRepo: Repository<NotificationEntity>,
  ) {}

  // Dans notification.service.ts

<<<<<<< HEAD
async createSignalNotification(
  signal: any,
  authorName: string,
  userId: number | null,
) {

  console.log('SAVE NOTIF USER ID =', userId);

  const newNotif = this.notifRepo.create({
    userId: userId,
    type: 'signal_new',
    title: `📍 Nouveau signalement : ${
      signal.titre || 'Signalement'
    }`,
    body: `${authorName} a créé un nouveau signalement : ${signal.titre}`,
=======
async createSignalNotification(signal: any, authorName: string,userId: number | null) {
  const newNotif = this.notifRepo.create({
    userId: userId, 
    type: 'signal_new',
    title: `📍 Nouveau signalement : ${signal.titre || 'Signalement'}`,
    // 🔥 On utilise ici le 'authorName' dynamique transmis par le service
    body: `${authorName} a créé un nouveau signalement : ${signal.titre}`, 
>>>>>>> 83e6525fc3ff88408fff4c0c536c24cc7127a968
    read: false,
  });

  return await this.notifRepo.save(newNotif);
}

  async getAllNotifications() {
    return await this.notifRepo.find({
      order: {
        timestamp: 'DESC',
      },
    });
  }

<<<<<<< HEAD
  async getNotificationsByUser(userId: number) {

  return await this.notifRepo.find({
    where: {
      userId: userId,
    },
  });
}

=======
>>>>>>> 83e6525fc3ff88408fff4c0c536c24cc7127a968
  async getUnreadNotifications() {
    return await this.notifRepo.find({
      where: {
        read: false,
      },
      order: {
        timestamp: 'DESC',
      },
    });
  }

  async markAsRead(id: number) {
    await this.notifRepo.update(id, {
      read: true,
    });

    return {
      message: 'Notification marquée comme lue',
    };
  }

  async markAllAsRead() {
    await this.notifRepo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ read: true })
      .execute();

    return {
      message: 'Toutes les notifications sont lues',
    };
  }

  async deleteNotification(id: number) {
    await this.notifRepo.delete(id);

    return {
      message: 'Notification supprimée',
    };
  }
}