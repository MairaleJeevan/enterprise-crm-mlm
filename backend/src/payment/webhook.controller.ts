import {
  Controller, Post, Headers, RawBodyRequest, Req,
  HttpCode, HttpStatus, UnauthorizedException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { RazorpayService } from './razorpay.service';
import { PaymentService } from './payment.service';

@ApiTags('Webhooks')
@Controller('api/payments/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private razorpay: RazorpayService,
    private paymentService: PaymentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook endpoint — verifies signature and handles events' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString('utf-8') || '';

    const isValid = this.razorpay.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('Invalid Razorpay webhook signature received');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      this.logger.error('Failed to parse webhook payload');
      return { status: 'ok' };
    }

    const event = payload?.event as string;
    this.logger.log(`Webhook received: ${event}`);

    await this.paymentService.handleWebhookEvent(event, payload);

    return { status: 'ok', event };
  }
}
