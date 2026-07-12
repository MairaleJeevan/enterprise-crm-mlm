import {
  Controller, Post, Get, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from './payment.service';
import { InvoiceService } from './invoice.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Razorpay order for Gold Card purchase' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentService.createOrder(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay payment signature and activate Gold Card' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics for Admin dashboard' })
  getStats() {
    return this.paymentService.getStats();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current advisor\'s payment history' })
  getMyPayments(@Request() req: any) {
    return this.paymentService.listMyPayments(req.user.id);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiOperation({ summary: 'List all payments (Admin only)' })
  listPayments(@Query('search') search?: string) {
    return this.paymentService.listPayments({ search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single payment detail' })
  getPayment(@Param('id') id: string) {
    return this.paymentService.getPayment(id);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Get invoice for a payment' })
  getInvoice(@Param('id') id: string) {
    return this.invoiceService.getInvoice(id);
  }
}
