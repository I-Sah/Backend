import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../chat/entities/chat.entity';
import { User } from '../user/entities/user.entity';
import { Conversation } from './entities/conversation.entity';
import { SendMessageDto } from './dto/sendMessage.dto';
import { ConfigService } from '@nestjs/config';
import { getErrorMessage } from '../common/utils/error.utils';
import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { AiResult } from './types/ai-result.type';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    // Models ai disponible
    private readonly models = [
        'openai/gpt-4.1-mini',
        'anthropic/claude-3-haiku',
        'deepseek/deepseek-chat',
        'mistralai/mistral-small-3.1',
    ];

    // Regle de promt chatBot
    private readonly systemPrompt = `
    Tu es I-Sah.

    Tu es un assistant spécialisé en communication.

    Tu aides les utilisateurs à :
    - mieux communiquer
    - reformuler leurs phrases
    - améliorer leurs messages
    - gérer des conflits
    - rédiger des messages professionnels
    - améliorer leur expression écrite
    - améliorer leur prise de parole

    Règles :
    - répondre en français
    - être clair
    - être utile
    - être professionnel
    - être concis
    `;
        


    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
        private readonly configService: ConfigService,
    ) {
         console.log(
        'OPENROUTER KEY =>',
        this.configService.get<string>(
            'OPENROUTER_API_KEY',
        ),
    );
    }

    async createConversation(userId: number, title: string) {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            const conversation = this.conversationRepository.create({
                title,
                user,
            });

            await this.conversationRepository.save(conversation);

            return {
                message: 'Conversation créée avec succès',
                data: conversation,
                status: 200,
            };
        } catch (error) {
            this.logger.error('Erreur createConversation :', getErrorMessage(error));
            throw new HttpException(getErrorMessage(error), 500);
        }
    }

    async listeConversation(userId: number) {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            const conversationsList = await this.conversationRepository.find({
                where: { user },
                order: { createdAt: 'DESC' },
            });

            return {
                message: 'Liste des conversations trouvées',
                data: conversationsList,
                status: 200,
            };
        } catch (error) {
            throw new HttpException('Erreur lors de la récupération des conversations', 500);
        }
    }

    async getHistoryConversation(conversationId: number) {
        try {
            const conversationMessages = await this.chatRepository.find({
                where: { conversation: { id: conversationId } },
                order: { createdAt: 'ASC' },
            });

            return {
                message: 'Messages trouvés',
                data: conversationMessages,
                status: 200,
            };
        } catch (error) {
            throw new HttpException('Erreur lors de la récupération des messages', 500);
        }
    }

    private async generateAIResponse(messages: any[]): Promise<AiResult> {
        let lastError: any = null;

        for (const model of this.models) {
            try {
                this.logger.log(`TRY MODEL => ${model}`);

                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model,
                        messages,
                        temperature: 0.7,
                        max_tokens: 1000,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.configService.get<string>(
                                'OPENROUTER_API_KEY',
                            )}`,
                            'Content-Type':
                                'application/json',
                            'HTTP-Referer':
                                'http://localhost:3000',
                            'X-Title':
                                'I-Sah Chatbot',
                        },
                        timeout: 30000,
                    },
                );

                const content =
                    response.data?.choices?.[0]
                        ?.message?.content;

                if (content) {
                    return {
                        success: true,
                        response: content,
                    };
                }
            } catch (error: any) {
                lastError = error;

                this.logger.error(
                    `MODEL FAIL => ${model}`,
                    error?.response?.data ||
                        error.message,
                );

                continue;
            }
        }

        return {
            success: false,
            error:
                lastError?.response?.data?.error
                    ?.message ||
                lastError?.message ||
                'Unknown AI error',
        };
    }


    async sendMessage(sendMessageDto: SendMessageDto) {
        try {
            const conversation =
                await this.conversationRepository.findOne(
                    {
                        where: {
                            id: sendMessageDto.conversationId,
                        },
                    },
                );

            if (!conversation) {
                throw new NotFoundException(
                    'Conversation non trouvée',
                );
            }

            /**
             * SAVE USER MESSAGE
             */
            const userMessage = this.chatRepository.create({
                    role: 'user',
                    message:sendMessageDto.content,
                    conversation,
                    status: 'completed'
                });

            await this.chatRepository.save(userMessage);

            /**
             * GET HISTORY
             */
            const lastMessages = await this.chatRepository.find({
                    where: {conversation: { id: sendMessageDto.conversationId }},
                    order: {createdAt: 'ASC'},
                    take: 20,
                });

            /**
             * FORMAT HISTORY
             */
            const formattedMessages = [
                {
                    role: 'system',
                    content: this.systemPrompt,
                },

                ...lastMessages.map((message) => ({
                    role:
                        message.role === 'assistant'
                            ? 'assistant'
                            : 'user',

                    content: message.message,
                })),
            ];

            /**
             * AI RESPONSE
             */
            const aiResult = await this.generateAIResponse(formattedMessages);

            if (aiResult.success) {
                const assistantMessage =
                    this.chatRepository.create({
                        role: 'assistant',
                        message: aiResult.response,
                        conversation,
                        status: 'completed',
                    });

                const saved =
                    await this.chatRepository.save(
                        assistantMessage,
                    );

                return {
                    message: 'Message envoyé avec succès',
                    data: saved,
                    status: 200,
                };
            }

            /**
             * CASE FAILED
             */
            const failedMessage =
                this.chatRepository.create({
                    role: 'assistant',
                    message:"Désolé, je n'ai pas pu répondre pour le moment.",
                    conversation,
                    status: 'failed',
                });

            const savedFailed = await this.chatRepository.save(
                    failedMessage,
                );

            return {
                message:
                    'IA indisponible (fallback activé)',
                data: savedFailed,
                error: aiResult.error,
                status: 200,
            };
        } catch (error) {
            this.logger.error(
                'AI ERROR :',
                getErrorMessage(error),
            );

            throw new HttpException(
                getErrorMessage(error),
                500,
            );
        }
    }

    async deleteChat(chatId: number) {
        try {
            const chat = await this.chatRepository.findOne({ where: { id: chatId } });

            if (!chat) {
                throw new NotFoundException('Message non trouvé');
            }

            await this.chatRepository.remove(chat);

            return {
                message: 'Message supprimé avec succès',
                status: 200,
            };
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    async deleteConversation(conversationId: number) {
        try {
            const conversation = await this.conversationRepository.findOne({
                where: { id: conversationId },
            });

            if (!conversation) {
                throw new NotFoundException('Conversation non trouvée');
            }

            await this.conversationRepository.remove(conversation);

            return {
                message: 'Conversation supprimée avec succès',
                status: 200,
            };
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}