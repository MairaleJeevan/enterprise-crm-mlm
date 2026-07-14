import { Controller, Get, Post, UseGuards, Req, Query } from '@nestjs/common';
import { MlmService } from './mlm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('mlm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/mlm')
export class MlmController {
  constructor(private readonly mlmService: MlmService) {}

  @Get('tree')
  getTree(@Req() req, @Query('depth') depth?: number) {
    const selectedDepth = depth ? parseInt(depth as any, 10) : 4;
    return this.mlmService.getTree(req.user.id, selectedDepth);
  }

  @Get('downline')
  getDownline(@Req() req) {
    return this.mlmService.getDownline(req.user.id);
  }

  @Get('commissions')
  getCommissions(@Req() req) {
    return this.mlmService.getCommissions(req.user.id);
  }

  @Get('payouts')
  getPayouts(@Req() req) {
    return this.mlmService.getPayouts(req.user.id);
  }

  @Post('payouts')
  createPayout(@Req() req) {
    return this.mlmService.createPayout(req.user.id);
  }

  @Get('notifications')
  getNotifications(@Req() req) {
    return this.mlmService.getNotifications(req.user.id);
  }

  @Post('notifications/read')
  markNotificationsRead(@Req() req) {
    return this.mlmService.markNotificationsRead(req.user.id);
  }

  @Get('held-commissions')
  getHeldCommissions(@Req() req) {
    return this.mlmService.getHeldCommissions(req.user.id);
  }
}
