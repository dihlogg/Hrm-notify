import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../../utils/pagination/pagination.dto';

@Controller('Notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('GetNotificationsByEmployeeId/:id')
  async getNotificationsByEmployeeId(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.notificationsService.getNotificationsByEmployeeId(
      id,
      pagination,
    );
  }

  @Get('GetUnSeenCountByRecipientId/:id')
  async getUnSeenCountByRecipientId(@Param('id') id: string) {
    return this.notificationsService.getUnSeenCountByRecipientId(id);
  }

  @Patch('MarkAllAsSeenByRecipientId/:id')
  async markAllAsSeenByRecipientId(@Param('id') id: string) {
    return this.notificationsService.markAllAsSeenByRecipientId(id);
  }

  @Get('GetUnReadCountByRecipientId/:id')
  async getUnReadCountByRecipientId(@Param('id') id: string) {
    return this.notificationsService.getUnReadCountByRecipientId(id);
  }

  @Patch('MarkAsRead/:id')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
