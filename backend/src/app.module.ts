import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FranchiseModule } from './franchise/franchise.module';
import { CustomerModule } from './customer/customer.module';
import { ProductModule } from './product/product.module';
import { SaleModule } from './sale/sale.module';
import { MlmModule } from './mlm/mlm.module';
import { QueueModule } from './queue/queue.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { FollowUpModule } from './followup/followup.module';
import { ReminderModule } from './reminder/reminder.module';
import { ReportsModule } from './reports/reports.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    FranchiseModule,
    CustomerModule,
    ProductModule,
    SaleModule,
    MlmModule,
    QueueModule,
    VehicleModule,
    FollowUpModule,
    ReminderModule,
    ReportsModule,
    PaymentModule,
  ],
})
export class AppModule {}
