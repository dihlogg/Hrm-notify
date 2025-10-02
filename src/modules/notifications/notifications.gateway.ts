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
    const { employeeId } = client.handshake.auth;

    if (employeeId) {
      client.join(employeeId.toString());
      console.log(`Client ${client.id} joined room ${employeeId}`);
    } else {
      console.warn(`Client ${client.id} connected without employeeId`);
    }
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

  // Gửi thông báo tới employees
  sendToMultipleEmployees(employeeIds: string[], payload: any) {
    employeeIds.forEach((employeeId) => {
      console.log(
        `Emitted event 'notification' to room '${employeeId}' with payload:`,
        payload,
      );
      this.server.to(employeeId).emit('notification', payload);
    });
  }
}
