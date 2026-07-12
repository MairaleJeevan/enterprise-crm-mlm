import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.goldInvoice.count();
    const sequence = String(count + 1).padStart(5, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  async createInvoice(
    tx: any,
    paymentId: string,
    customerId: string,
    amount: number,
  ) {
    const invoiceNumber = await this.generateInvoiceNumber();
    const taxRate = 0.18; // 18% GST
    const subtotal = parseFloat((amount / (1 + taxRate)).toFixed(2));
    const tax = parseFloat((amount - subtotal).toFixed(2));

    const invoice = await tx.goldInvoice.create({
      data: {
        invoiceNumber,
        paymentId,
        customerId,
        subtotal,
        tax,
        total: amount,
      },
    });

    return invoice;
  }

  async getInvoice(paymentId: string) {
    return this.prisma.goldInvoice.findUnique({
      where: { paymentId },
      include: {
        payment: {
          include: {
            customer: true,
            advisor: { select: { firstName: true, lastName: true, email: true } },
            goldCard: true,
          },
        },
      },
    });
  }
}
