import { Module } from '@nestjs/common';
import { MlmService } from './mlm.service';
import { MlmController } from './mlm.controller';

@Module({
  providers: [MlmService],
  controllers: [MlmController],
  exports: [MlmService],
})
export class MlmModule {}
