import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from './qr.service';

@Injectable()
export class GoldCardService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
  ) {}

  async generateCardNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.goldCard.count();
    const sequence = String(count + 1).padStart(7, '0');
    return `GLD${year}${sequence}`;
  }

  async createCard(
    tx: any,
    customerId: string,
    paymentId: string,
    validityMonths = 12,
  ) {
    const cardNumber = await this.generateCardNumber();
    const activationDate = new Date();
    const expiryDate = new Date(activationDate);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

    const qrData = JSON.stringify({
      cardNumber,
      customerId,
      issuer: 'Jeevan Gold Membership',
      activationDate: activationDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
    });

    const qrCode = await this.qrService.generateBase64(qrData);

    const goldCard = await tx.goldCard.create({
      data: {
        cardNumber,
        customerId,
        paymentId,
        activationDate,
        expiryDate,
        status: 'ACTIVE',
        qrCode,
      },
    });

    return goldCard;
  }
}
