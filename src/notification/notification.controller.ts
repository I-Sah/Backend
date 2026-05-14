import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  // Toutes les notifications
  @Get()
  async getAll() {
    return this.notificationService.getAllNotifications();
  }

  // Notifications non lues
  @Get('unread')
  async getUnread() {
    return this.notificationService.getUnreadNotifications();
  }

  // Marquer une notification comme lue
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(id);
  }

  // Tout marquer comme lu
  @Patch('read-all')
  async markAllAsRead() {
    return this.notificationService.markAllAsRead();
  }

  // Supprimer une notification
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.deleteNotification(id);
  }
}