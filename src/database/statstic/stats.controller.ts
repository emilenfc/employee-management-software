import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { ApiTags } from '@nestjs/swagger';

@Controller({ path: 'statistic', version: '1' })
@ApiTags('Statistics')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('total')
  async getStats() {
    const stats = await this.statsService.getTotalCounts();
    return {
      message: 'total number of records fetched successfully',
      stats,
    };
  }
}
