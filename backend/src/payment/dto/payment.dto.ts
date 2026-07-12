import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer ID to purchase the Gold Card for' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Sales Advisor User ID' })
  @IsString()
  @IsNotEmpty()
  advisorId: string;

  @ApiPropertyOptional({ description: 'Franchise ID (optional)' })
  @IsString()
  @IsOptional()
  franchiseId?: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay Payment ID from checkout callback' })
  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @ApiProperty({ description: 'Razorpay Order ID created by backend' })
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @ApiProperty({ description: 'HMAC-SHA256 signature from Razorpay' })
  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  @ApiProperty({ description: 'Internal Payment DB record ID' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;
}
