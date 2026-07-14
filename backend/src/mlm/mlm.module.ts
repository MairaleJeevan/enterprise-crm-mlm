import { Module } from '@nestjs/common';
import { MlmService } from './mlm.service';
import { MlmRankService } from './mlm-rank.service';
import { KycService } from './services/kyc.service';
import { PolicyService } from './services/policy.service';
import { ReferralService } from './services/referral.service';
import { AwardService } from './services/award.service';
import { MlmController } from './mlm.controller';
import { KycController } from './controllers/kyc.controller';
import { PolicyController } from './controllers/policy.controller';
import { ReferralController } from './controllers/referral.controller';
import { AwardController } from './controllers/award.controller';
import { AdminConfigController } from './controllers/admin-config.controller';

@Module({
  providers: [
    MlmService,
    MlmRankService,
    KycService,
    PolicyService,
    ReferralService,
    AwardService,
  ],
  controllers: [
    MlmController,
    KycController,
    PolicyController,
    ReferralController,
    AwardController,
    AdminConfigController,
  ],
  exports: [
    MlmService,
    MlmRankService,
    KycService,
    PolicyService,
    ReferralService,
    AwardService,
  ],
})
export class MlmModule {}
