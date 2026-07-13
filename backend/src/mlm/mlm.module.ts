import { Module } from '@nestjs/common';
import { MlmService } from './mlm.service';
import { MlmRankService } from './mlm-rank.service';
import { MlmController } from './mlm.controller';

@Module({
  providers: [MlmService, MlmRankService],
  controllers: [MlmController],
  exports: [MlmService, MlmRankService],
})
export class MlmModule {}
