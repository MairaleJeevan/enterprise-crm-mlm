import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CommissionProcessor } from './commission.processor';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'sales',
    }),
  ],
  providers: [CommissionProcessor],
  exports: [BullModule],
})
export class QueueModule {}
