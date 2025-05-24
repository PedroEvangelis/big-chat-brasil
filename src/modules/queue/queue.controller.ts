import { Controller, Get, Inject } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('status') // '/queue/status'
  async getQueueStatus(): Promise<any> {
    return await this.queueService.getQueueMetrics();
  }
}
