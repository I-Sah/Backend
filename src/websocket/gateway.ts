import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { string } from 'joi';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface UserInfo {
  socketId: string;
  userId: number;
  username: string;
  room: string;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  room: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'notification';
}

interface Notification {
  id: string;
  userId: number;        // destinataire
  type: 'mention' | 'room_invite' | 'message' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  meta?: Record<string, any>;
}

// ─────────────────────────────────────────────
// Gateway
// ─────────────────────────────────────────────
@WebSocketGateway({
  cors: { origin: '*' },
  // namespace: '/chat',
  transports: ['polling','websocket'],
})
export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  
  constructor(private readonly jwtService: JwtService,
    @InjectRepository(ChatMessageEntity) 
    private readonly msgRepo: Repository<ChatMessageEntity>,
    @InjectRepository(NotificationEntity) 
    private readonly notifRepo: Repository<NotificationEntity>,
  ) {}
  // Stockage en mémoire (remplacer par Redis/BDD en prod)
  private connectedUsers = new Map<string, UserInfo>();
  private messageHistory = new Map<string, ChatMessage[]>(); // room → messages
  private notifications = new Map<string, Notification[]>(); // userId → notifs

  // ─────────────────────────────────────────────
  // CONNEXION
  // ─────────────────────────────────────────────
  async handleConnection(client: Socket) {
    try {
      const token = 
      client.handshake.auth?.token || 
      client.handshake.headers.authorization?.split(' ')[1] || 
      client.handshake.query?.token;
      if (!token) throw new UnauthorizedException();

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'secret',
      });

      // On attache l'utilisateur au socket pour éviter de lui redemander son pseudo
      client.data.user = payload; 
      console.log(`[WS] User ${payload.pseudo} connected`);
      
      client.emit('connected', { status: 'success', userId: payload.sub });
    } catch (e) {
      console.log('[WS] Connection refused: Invalid Token');
      client.disconnect();
    }
  }

  // ─────────────────────────────────────────────
  // DÉCONNEXION
  // ─────────────────────────────────────────────
  handleDisconnect(client: Socket) {
    console.log('CLIENT DISCONNECTED');
    console.log(client.id);
  }

  // ─────────────────────────────────────────────
  // INSCRIPTION / IDENTIFICATION
  // ─────────────────────────────────────────────
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Le pseudo vient maintenant du JWT sécurisé, pas de l'input utilisateur
    const userPayload = client.data.user;
    const { room } = data;

    if (!room) {
      client.emit('error', { message: 'La room est requise.' });
      return;
    }

    client.join(room);

    const userInfo: UserInfo = {
  socketId: client.id,
  userId: Number(userPayload.sub),
  username: userPayload.pseudo,
  room,
  joinedAt: new Date(),
};
    
    this.connectedUsers.set(client.id, userInfo);

    // Envoi de l'historique et notifications non lues
    const history = this.messageHistory.get(room) ?? [];
    const unread = (this.notifications.get(userPayload.sub.toString()) ?? []).filter(n => !n.read);

    client.emit('registered', { user: userInfo, history, unreadNotifications: unread });

    this.server.to(room).except(client.id).emit('room:user-joined', {
      userId: client.id,
      username: userPayload.pseudo,
      timestamp: new Date(),
    });
  }
  // ─────────────────────────────────────────────
  // ENVOI D'UN MESSAGE
  // ─────────────────────────────────────────────
  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: { content: string; room?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sender = this.connectedUsers.get(client.id);
    if (!sender) return ;

    const room = data.room ?? sender.room;
//Sauvegarde en base de données
    const savedMsg = await this.msgRepo.save({
      senderId: client.id,
      senderName: sender.username, room,
      content: data.content,
    });
    
    this.connectedUsers.forEach(async (user, socketId) => {
    if (user.room === room && socketId !== client.id) {
      await this.pushNotificationToUser(user, {
        type: 'message',
        title: `Nouveau message dans ${room}`,
        body: `${sender.username}: ${data.content}`,
      });
    }
  });

    console.log(`[WS] Message in "${room}" from ${sender.username}: ${data.content}`);
  }

  // ─────────────────────────────────────────────
  // MESSAGE PRIVÉ
  // ─────────────────────────────────────────────
  @SubscribeMessage('message:private')
  handlePrivateMessage(
    @MessageBody() data: { toUserId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sender = this.connectedUsers.get(client.id);
    if (!sender) {
      client.emit('error', { message: 'Non enregistré.' });
      return;
    }

    const msg: ChatMessage = {
      id: this.generateId(),
      senderId: client.id,
      senderName: sender.username,
      room: `pm:${client.id}:${data.toUserId}`,
      content: data.content,
      timestamp: new Date(),
      type: 'text',
    };

    // Envoyer à l'expéditeur et au destinataire
    client.emit('message:private', { ...msg, direction: 'out' });
    this.server
      .to(data.toUserId)
      .emit('message:private', { ...msg, direction: 'in' });

    // Notification push au destinataire
    const targetUser = Array.from(this.connectedUsers.values())
  .find(user => user.userId === Number(data.toUserId));

if (targetUser) {
  this.pushNotificationToUser(targetUser, {
    type: 'message',
    title: `Message de ${sender.username}`,
    body:
      data.content.length > 60
        ? data.content.slice(0, 57) + '…'
        : data.content,
    meta: {
      fromId: client.id,
      fromName: sender.username,
    },
  });
}
  }

  // ─────────────────────────────────────────────
  // LIRE LES NOTIFICATIONS
  // ─────────────────────────────────────────────
  @SubscribeMessage('notification')
    handleNotification(
    @MessageBody() data: any,
    ) {

    console.log('NOTIFICATION RECEIVED');

    this.server.emit('notification', {
      title: data.title,
      content: data.content,
    });

    console.log('NOTIFICATION SENT');
  }

  @SubscribeMessage('notifications:get')
  handleGetNotifications(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.sub;

const notifs =
  this.notifications.get(userId.toString()) ?? [];
    client.emit('notifications:list', notifs);
  }

  @SubscribeMessage('notifications:read')
  handleMarkRead(
    @MessageBody() data: { ids: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.sub;

const notifs =
  this.notifications.get(userId.toString()) ?? [];
    const updated = notifs.map((n) =>
      data.ids.includes(n.id) ? { ...n, read: true } : n,
    );
    this.notifications.set(client.id, updated);
    client.emit('notifications:updated', updated);
  }

  @SubscribeMessage('notifications:read-all')
  handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.sub.toString();

const notifs =
  (this.notifications.get(userId) ?? []).map((n) => ({
    ...n,
    read: true,
  }));

this.notifications.set(userId, notifs);
  }

  // ─────────────────────────────────────────────
  // INDICATEUR DE FRAPPE (typing)
  // ─────────────────────────────────────────────
  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;
    client
      .to(user.room)
      .emit('typing:start', { userId: client.id, username: user.username });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;
    client
      .to(user.room)
      .emit('typing:stop', { userId: client.id, username: user.username });
  }

  // ─────────────────────────────────────────────
  // HELPERS PRIVÉS
  // ─────────────────────────────────────────────
  private broadcastOnlineUsers() {
    const users = Array.from(this.connectedUsers.values());
    this.server.emit('users:online', users);
  }

  private async pushNotificationToUser(
  user: UserInfo,
  payload: { type: string; title: string; body: string; meta?: any },
) {
  if (!user?.userId || isNaN(user.userId)) {
    console.log('❌ INVALID USER ID:', user);
    return;
  }

  const newNotif = await this.notifRepo.save({
    userId: user.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    read: false,
  });

  // socket
  this.server.to(user.socketId).emit('notification:new', newNotif);
console.log('SAVE NOTIF ->', {
  userId: user.userId,
  type: payload.type,
});
  return newNotif;
}

  private pushNotificationToRoom(
    room: string,
    excludeId: string,
    payload: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>,
  ) {
    this.connectedUsers.forEach((user, socketId) => {
      if (user.room === room && socketId !== excludeId) {
        this.pushNotificationToUser(user, payload);
      }
    });
  }

  private handleMentions(msg: ChatMessage, room: string) {
    const mentions = msg.content.match(/@(\w+)/g);
    if (!mentions) return;

    mentions.forEach((mention) => {
      const username = mention.slice(1);
      this.connectedUsers.forEach((user, socketId) => {
        if (
          user.username.toLowerCase() === username.toLowerCase() &&
          socketId !== msg.senderId
        ) {
          this.pushNotificationToUser(user, {
            type: 'mention',
            title: `${msg.senderName} vous a mentionné`,
            body: msg.content,
            meta: { room, messageId: msg.id },
          });
        }
      });
    });
  }
  @SubscribeMessage('chat')
  handleChat(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {

    console.log('CHAT RECEIVED');
    console.log(data);

    this.server.to(data.room).emit('chat', {
      username: data.username,
      message: data.message,
      room: data.room,
      time: new Date(),
    });

    console.log('CHAT SENT TO ROOM');
  }
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

 async broadcastSignalNotification(
  signal: any,
  authorName: string,
) {

  const notifPayload = {
    type: 'signal_new',
    title: `📍 Nouveau signalement : ${signal.titre}`,
    body: `${authorName} a créé un nouveau signalement : ${signal.titre}`,
    meta: {
      signalId: signal.signal_id,
      latitude: signal.latitude,
      longitude: signal.longitude,
    },
  };

  // Event global temps réel
  this.server.emit('signal:new', {
    signal,
    notification: notifPayload,
  });

  // Notification individuelle
  for (const user of this.connectedUsers.values()) {

    await this.pushNotificationToUser(user, {
      type: 'message',
      title: notifPayload.title,
      body: notifPayload.body,
      meta: notifPayload.meta,
    });
  }
}
}