import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ReferralService } from '../services/referral.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('dashboard')
  getReferralDashboard(@Req() req) {
    return this.referralService.getReferralDashboard(req.user.id);
  }
}
