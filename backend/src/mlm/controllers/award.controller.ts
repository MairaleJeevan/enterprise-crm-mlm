import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AwardService } from '../services/award.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('awards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/awards')
export class AwardController {
  constructor(private readonly awardService: AwardService) {}

  @Get('my')
  getMyAwards(@Req() req) {
    return this.awardService.getMyAwards(req.user.id);
  }

  @Get('all')
  getAllAwards() {
    return this.awardService.getAllAwards();
  }
}
