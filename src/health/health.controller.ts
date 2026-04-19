import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  getHealth(): { status: string; at: string } {
    return { status: 'ok', at: new Date().toISOString() };
  }
}
