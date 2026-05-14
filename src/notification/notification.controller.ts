import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';

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
  @Get('notifications/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(
    @Req() req: any,
  ) {

    const userId = req.user.userId;

    return await this.notificationService.getNotificationsByUser(userId);
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