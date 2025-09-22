import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } }) //open cors cho fe
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    console.log(`CLient disconnected: ${client.id}`);
  }
  // gửi thông báo tới tất cả FE
  sendBroadcast(event: string, payload: any) {
    this.server.emit(event, payload);
  }
  // Gửi thông báo tới specific employee
  sendToEmployee(employeeId: string, payload: any) {
    this.server.to(employeeId).emit('notification', payload);
  }
}
