import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/createConversation.dto';
import { SendMessageDto } from './dto/sendMessage.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';

@Controller('chatbot-ai')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    @Post('conversation')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Créer une session de conversation'
    })
    createConversation(@Req() user,@Body() createConversationDto: CreateConversationDto) {
        return this.chatService.createConversation(user.user.userId, createConversationDto.title);
    }

    @Post('message')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'discuter à une sujet de conversation'
    })
    sendMessage(@Body() sendMessageDto: SendMessageDto) {
        return this.chatService.sendMessage(sendMessageDto);
    }

    @Get('list-conversation')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Liste conversation'
    })
    getListConversation(@Req() user){
        return this.chatService.listeConversation(user.user.userId);
    }

    @Get('history/:conversationId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'fil de discution d\'une conversation'
    })
    getHistoryConversation(@Param('conversationId') conversationId: number){
        return this.chatService.getHistoryConversation(conversationId);
    }

    @Delete('chat/:chadId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: "Supprimer un message"
    })
    deleteChat(@Param('chatId') chatId: number){
        return this.chatService.deleteChat(chatId);
    }

    @Delete('conversation/:conversationId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Supprimer une conversation'
    })
    deleteConversation(@Param('conversationId') conversationId: number){
        return this.chatService.deleteConversation(conversationId);
    }
}
