import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SaleService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('sales') private salesQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateSaleDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const franchise = await this.prisma.franchise.findUnique({
      where: { id: dto.franchiseId },
    });
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;
      const saleItemsData = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        if (!product.inventory || product.inventory.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${product.inventory?.quantity || 0}, Requested: ${item.quantity}`
          );
        }

        const unitPrice = product.sellingPrice;
        const itemDiscount = item.discount || 0;
        const itemTotal = unitPrice * item.quantity - itemDiscount;
        const itemTax = itemTotal * product.taxRate;

        subtotal += itemTotal;
        totalTax += itemTax;

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          discount: itemDiscount,
          total: itemTotal,
        });
      }

      // Apply Gold Member discount (e.g. 10% off subtotal)
      let discount = 0;
      if (customer.isGoldMember) {
        discount = subtotal * 0.10;
      }

      const total = subtotal - discount + totalTax;

      // Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: dto.customerId,
          franchiseId: dto.franchiseId,
          userId,
          subtotal,
          discount,
          tax: totalTax,
          total,
          goldCardId: customer.goldCardId,
          paymentStatus: 'PAID',
          paymentMethod: dto.paymentMethod || 'CASH',
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          customer: true,
          franchise: true,
        },
      });

      // Push asynchronous task to BullMQ for commission calculation
      await this.salesQueue.add('processSale', { saleId: sale.id });

      return sale;
    });
  }

  async findAll(franchiseId?: string, customerId?: string) {
    const where: any = {};
    if (franchiseId) where.franchiseId = franchiseId;
    if (customerId) where.customerId = customerId;

    return this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        franchise: { select: { name: true, code: true } },
        user: { select: { email: true, firstName: true } },
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
        franchise: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!sale) {
      throw new NotFoundException('Invoice not found');
    }
    return sale;
  }
}
