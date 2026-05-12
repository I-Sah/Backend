import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Chat } from './entities/chat.entity';
import { Conversation } from './entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Conversation, User])],
  providers: [ChatService,],
  controllers: [ChatController]
})
export class ChatModule {}
