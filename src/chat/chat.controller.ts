import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/createConversation.dto';
import { SendMessageDto } from './dto/sendMessage.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    @Post('session')
    @ApiOperation({
        summary: 'Créer une session de conversation'
    })
    createConversation(@Body() createConversationDto: CreateConversationDto) {
        return this.chatService.createConversation(createConversationDto.userId, createConversationDto.title);
    }

    @Post('message')
    @ApiOperation({
        summary: 'discuter à une sugger'
    })
    sendMessage(@Body() sendMessageDto: SendMessageDto) {
        return this.chatService.sendMessage(sendMessageDto);
    }

    @Get('conversation/:userId')
    @ApiOperation({
        summary: 'Créer une session de conversation'
    })
    getListConversation(@Param('userId') userId: number){
        return this.chatService.listeConversation(userId);
    }

    @Get('history/:conversationId')
    @ApiOperation({
        summary: 'Créer une session de conversation'
    })
    getHistoryConversation(@Param('conversationId') conversationId: number){
        return this.chatService.getHistoryConversation(conversationId);
    }

    @Delete('chat/:chadId')
    @ApiOperation({
        summary: "Supprimer un message"
    })
    deleteChat(@Param('chatId') chatId: number){
        return this.chatService.deleteChat(chatId);
    }

    @Delete('conversation/:conversationId')
    @ApiOperation({
        summary: 'Supprimer une conversation'
    })
    deleteConversation(@Param('conversationId') conversationId: number){
        return this.chatService.deleteConversation(conversationId);
    }
}
