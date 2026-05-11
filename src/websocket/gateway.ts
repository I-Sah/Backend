import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface UserInfo {
  id: string;
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
  userId: string;        // destinataire
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
  transports: ['websocket'],
})
export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  
  constructor(private readonly jwtService: JwtService) {}
  // Stockage en mémoire (remplacer par Redis/BDD en prod)
  private connectedUsers = new Map<string, UserInfo>();
  private messageHistory = new Map<string, ChatMessage[]>(); // room → messages
  private notifications = new Map<string, Notification[]>(); // userId → notifs

  // ─────────────────────────────────────────────
  // CONNEXION
  // ─────────────────────────────────────────────
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
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
      id: client.id,
      username: userPayload.pseudo, // Sécurisé
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
  handleMessage(
    @MessageBody() data: { content: string; room?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sender = this.connectedUsers.get(client.id);
    if (!sender) {
      client.emit('error', { message: 'Non enregistré. Envoyez "register" d\'abord.' });
      return;
    }

    const room = data.room ?? sender.room;
    const msg: ChatMessage = {
      id: this.generateId(),
      senderId: client.id,
      senderName: sender.username,
      room,
      content: data.content,
      timestamp: new Date(),
      type: 'text',
    };

    // Sauvegarder dans l'historique (max 100 messages par room)
    const history = this.messageHistory.get(room) ?? [];
    history.push(msg);
    if (history.length > 100) history.shift();
    this.messageHistory.set(room, history);

    // Diffuser à toute la room
    this.server.to(room).emit('message:new', msg);

    // Détecter les mentions (@username)
    this.handleMentions(msg, room);

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
    this.pushNotificationToUser(data.toUserId, {
      type: 'message',
      title: `Message de ${sender.username}`,
      body: data.content.length > 60 ? data.content.slice(0, 57) + '…' : data.content,
      meta: { fromId: client.id, fromName: sender.username },
    });
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
    const notifs = this.notifications.get(client.id) ?? [];
    client.emit('notifications:list', notifs);
  }

  @SubscribeMessage('notifications:read')
  handleMarkRead(
    @MessageBody() data: { ids: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const notifs = this.notifications.get(client.id) ?? [];
    const updated = notifs.map((n) =>
      data.ids.includes(n.id) ? { ...n, read: true } : n,
    );
    this.notifications.set(client.id, updated);
    client.emit('notifications:updated', updated);
  }

  @SubscribeMessage('notifications:read-all')
  handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const notifs = (this.notifications.get(client.id) ?? []).map((n) => ({
      ...n,
      read: true,
    }));
    this.notifications.set(client.id, notifs);
    client.emit('notifications:updated', notifs);
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

  private pushNotificationToUser(
    socketId: string,
    payload: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>,
  ) {
    const notif: Notification = {
      id: this.generateId(),
      userId: socketId,
      read: false,
      createdAt: new Date(),
      ...payload,
    };
    const list = this.notifications.get(socketId) ?? [];
    list.unshift(notif);
    if (list.length > 50) list.pop();
    this.notifications.set(socketId, list);

    // Émettre en temps réel si le client est connecté
    this.server.to(socketId).emit('notification:new', notif);
  }

  private pushNotificationToRoom(
    room: string,
    excludeId: string,
    payload: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>,
  ) {
    this.connectedUsers.forEach((user, socketId) => {
      if (user.room === room && socketId !== excludeId) {
        this.pushNotificationToUser(socketId, payload);
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
          this.pushNotificationToUser(socketId, {
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
}