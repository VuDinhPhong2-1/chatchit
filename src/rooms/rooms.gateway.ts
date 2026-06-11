import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
type JoinRoomPayload = {
  roomId: string;
  senderId: string;
  senderName: string;
};

type SendRoomMessagePayload = {
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  askAi?: boolean;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RoomsGateway.name);
  constructor(private readonly roomsService: RoomsService) { }
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    client.join(payload.roomId);

    client.emit('room_joined', {
      roomId: payload.roomId,
      socketId: client.id,
    });

    client.to(payload.roomId).emit('user_joined', {
      roomId: payload.roomId,
      senderId: payload.senderId,
      senderName: payload.senderName,
    });

    this.logger.log(`${payload.senderName} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('send_room_message')
  async handleSendRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendRoomMessagePayload,
  ) {
    try {
      const message = await this.roomsService.createHumanMessage(payload.roomId, {
        senderId: payload.senderId,
        senderName: payload.senderName,
        content: payload.content,
      });

      this.server.to(payload.roomId).emit('message_created', message);

      this.logger.log(
        `${payload.senderName} sent message to room ${payload.roomId}`,
      );
    } catch (error) {
      this.logger.error(error);

      client.emit('room_error', {
        message: 'Không gửi được tin nhắn',
      });
    }
  }
}