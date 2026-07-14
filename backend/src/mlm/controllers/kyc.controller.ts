import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { KycService } from '../services/kyc.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  submitKyc(@Req() req, @Body() body: any) {
    return this.kycService.submitKyc(req.user.id, body);
  }

  @Get('status')
  getKycStatus(@Req() req) {
    return this.kycService.getKycStatus(req.user.id);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get('pending')
  getPendingKycs() {
    return this.kycService.getPendingKycs();
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('verify/:id')
  verifyKyc(
    @Param('id') kycId: string,
    @Req() req,
    @Body() body: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string },
  ) {
    return this.kycService.verifyKyc(kycId, req.user.id, body.action, body.rejectionReason);
  }
}
