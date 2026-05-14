import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationEntity } from '../websocket/entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gateway } from '../websocket/gateway';
import { Signal } from '../signal/entities/signal.entity';
import { AuthModule } from '../auth/auth.module';
import { ChatMessageEntity } from '../websocket/entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      Signal,
      ChatMessageEntity,
    ]),
      AuthModule,
  ],
  controllers: [
    NotificationController,
  ],
  providers: [NotificationService,Gateway],
  exports: [
    Gateway,NotificationService,
  ],
})
export class NotificationModule {}
