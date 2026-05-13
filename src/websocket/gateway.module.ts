import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Gateway } from './gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { NotificationEntity } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, ChatMessageEntity]),
    // Importation indispensable pour que JwtService soit injectable dans le Gateway
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [Gateway],
})
export class GatewayModule {}