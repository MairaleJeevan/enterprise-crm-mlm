import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaymentService } from './payment.service';
import { RazorpayService } from './razorpay.service';
import { GoldCardService } from './goldcard.service';
import { InvoiceService } from './invoice.service';
import { QrService } from './qr.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService, RazorpayService, GoldCardService, InvoiceService, QrService],
  exports: [PaymentService],
})
export class PaymentModule {}
