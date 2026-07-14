import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PolicyService } from '../services/policy.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('policy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get('my')
  getMyPolicies(@Req() req) {
    return this.policyService.getMyPolicies(req.user.id);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get('all')
  getAllPolicies() {
    return this.policyService.getAllPolicies();
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('assign')
  assignPolicy(@Req() req, @Body() body: any) {
    return this.policyService.assignPolicy(req.user.id, body);
  }
}
