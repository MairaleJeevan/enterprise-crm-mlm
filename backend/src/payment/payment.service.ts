import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { GoldCardService } from './goldcard.service';
import { InvoiceService } from './invoice.service';
import { MlmRankService } from '../mlm/mlm-rank.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/payment.dto';
import * as bcrypt from 'bcryptjs';

const GOLD_CARD_PRICE_PAISE = parseInt(process.env.GOLD_CARD_PRICE || '299900', 10);
const GOLD_CARD_PRICE_INR = GOLD_CARD_PRICE_PAISE / 100;

// MLM Commission — flat amounts paid to the selling advisor and upline by rank
const COMMISSION_SELLING_ADVISOR = 500;   // the advisor who made the sale
const COMMISSION_TL             = 300;   // first Team Leader (TL) upline
const COMMISSION_TEAM_MANAGER   = 200;   // first Team Manager upline
const COMMISSION_FOUNDER        = 25;    // first Founder Member upline

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private razorpay: RazorpayService,
    private goldCardService: GoldCardService,
    private invoiceService: InvoiceService,
    private mlmRankService: MlmRankService,
  ) {}

  // ─── Create Razorpay Order ────────────────────────────────────────────────
  async createOrder(dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const advisor = await this.prisma.user.findUnique({ where: { id: dto.advisorId } });
    if (!advisor) throw new NotFoundException('Advisor not found');

    // Check if customer already has active gold card
    const existingCard = await this.prisma.goldCard.findFirst({
      where: { customerId: dto.customerId, status: 'ACTIVE' },
    });
    if (existingCard) {
      throw new BadRequestException('Customer already has an active Gold Membership Card');
    }

    const shortId = dto.customerId.slice(-8);
    const ts = Date.now().toString().slice(-8);
    const receipt = `gc_${shortId}_${ts}`;  // max ~21 chars
    const order = await this.razorpay.createOrder(GOLD_CARD_PRICE_PAISE, receipt);

    // Store pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount: GOLD_CARD_PRICE_INR,
        currency: 'INR',
        status: 'PENDING',
        customerId: dto.customerId,
        advisorId: dto.advisorId,
        franchiseId: dto.franchiseId,
      },
    });

    return {
      orderId: order.id,
      paymentId: payment.id,
      amount: GOLD_CARD_PRICE_PAISE,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      customerName: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      customerEmail: customer.email || '',
      customerPhone: customer.phone,
      description: 'Jeevan Gold Membership Card',
    };
  }

  // ─── Verify Payment & Activate Card ─────────────────────────────────────
  async verifyPayment(dto: VerifyPaymentDto) {
    const isValid = this.razorpay.verifySignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );

    if (!isValid) {
      await this.prisma.payment.update({
        where: { id: dto.paymentId },
        data: { status: 'FAILED', failureReason: 'Invalid payment signature' },
      });
      throw new ForbiddenException('Invalid payment signature. Transaction rejected.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { customer: true },
    });

    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status === 'CAPTURED') {
      throw new BadRequestException('Payment already processed');
    }

    // ── Atomic Transaction: Activate everything ──────────────────────────
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update payment to CAPTURED
      const updatedPayment = await tx.payment.update({
        where: { id: dto.paymentId },
        data: {
          razorpayPaymentId: dto.razorpay_payment_id,
          razorpaySignature: dto.razorpay_signature,
          status: 'CAPTURED',
          paymentMethod: 'RAZORPAY',
        },
      });

      // 2. Generate Gold Card + QR
      const goldCard = await this.goldCardService.createCard(tx, payment.customerId, dto.paymentId);

      // 3. Create Invoice
      const invoice = await this.invoiceService.createInvoice(
        tx, dto.paymentId, payment.customerId, payment.amount,
      );

      // 4. Auto-create User account (MLM_DISTRIBUTOR) + MlmNode under the advisor
      const newAccount = await this.createGoldCardUserAccount(
        tx, payment.customer, payment.advisorId,
      );

      // 5. Update Customer: mark as Gold Member, link card and user account
      await tx.customer.update({
        where: { id: payment.customerId },
        data: {
          isGoldMember: true,
          goldCardId: goldCard.id,
          ...(newAccount ? { userId: newAccount.userId } : {}),
        },
      });

      // 6. Generate MLM Commissions (3 levels up from advisor)
      await this.generateMlmCommissions(tx, payment.advisorId, payment.amount, dto.paymentId);

      return { payment: updatedPayment, goldCard, invoice, newAccount };
    });

    return result;
  }

  // ─── Auto-create User Account for Gold Card Member ───────────────────────
  /**
   * Creates a User (MLM_DISTRIBUTOR) + MlmNode for a new Gold Card customer.
   *   Email:    customer email if provided, otherwise phone@goldmember.jeevan
   *   Password: phone number (hashed before storage; shown once on success screen)
   *   MLM parent: the selling advisor's MlmNode
   *
   * Idempotent — returns existing account if email already registered.
   */
  private async createGoldCardUserAccount(
    tx: any,
    customer: { id: string; firstName: string; lastName?: string | null; email?: string | null; phone: string },
    advisorId: string,
  ): Promise<{ userId: string; email: string; plainPassword: string } | null> {
    const email = customer.email?.trim()
      ? customer.email.trim().toLowerCase()
      : `${customer.phone}@goldmember.jeevan`;

    const plainPassword = customer.phone;

    // Idempotency: skip if an account with this email already exists
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      return { userId: existing.id, email, plainPassword };
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: customer.firstName,
        lastName: customer.lastName ?? null,
        role: 'MLM_DISTRIBUTOR',
      },
    });

    // Place the new member under the selling advisor in the MLM tree
    const advisorNode = await tx.mlmNode.findUnique({ where: { userId: advisorId } });

    await tx.mlmNode.create({
      data: {
        userId: newUser.id,
        parentId: advisorNode?.id ?? null,
        placementId: advisorNode?.id ?? null,
        rank: 'Sales Advisor',
      },
    });

    // Re-evaluate the advisor's rank now they have a new direct member
    if (advisorNode) {
      await this.mlmRankService.checkAndUpgradeRank(tx, advisorNode.id);
    }

    return { userId: newUser.id, email, plainPassword };
  }

  // ─── Rank Upgrade Engine ──────────────────────────────────────────────────
  // Delegated to shared MlmRankService (injected via constructor)

  // ─── MLM Commission Engine ───────────────────────────────────────────────
  /**
   * Commission structure (flat amounts per Gold Card sale):
   *   Selling advisor          → ₹500
   *   First TL upline          → ₹300
   *   First Team Manager upline → ₹200
   *   First Founder upline     → ₹25
   *
   * Walk up the parentId chain from the advisor's node.
   * Each rank is paid exactly once; already-paid ranks are skipped.
   */
  private async generateMlmCommissions(
    tx: any,
    advisorId: string,
    _saleAmount: number,
    paymentId: string,
  ) {
    const advisorNode = await tx.mlmNode.findUnique({
      where: { userId: advisorId },
      include: { user: true },
    });
    if (!advisorNode) return;

    // 1. Pay the selling advisor their flat commission
    await tx.commission.create({
      data: {
        userId: advisorId,
        amount: COMMISSION_SELLING_ADVISOR,
        type: 'GOLD_CARD_ADVISOR',
        description: `Selling advisor commission — Gold Card sale`,
        status: 'PENDING',
        saleId: paymentId,
      },
    });

    // Ranks still owed payment as we walk upward
    const pending = new Map<string, number>([
      ['Team Leader (TL)', COMMISSION_TL],
      ['Team Manager',     COMMISSION_TEAM_MANAGER],
      ['Founder Member',   COMMISSION_FOUNDER],
    ]);

    const rankType: Record<string, string> = {
      'Team Leader (TL)': 'GOLD_CARD_TL',
      'Team Manager':     'GOLD_CARD_TM',
      'Founder Member':   'GOLD_CARD_FOUNDER',
    };

    // 2. Walk up the tree and pay the first matching upline for each rank
    let currentNodeId: string | null = advisorNode.parentId;

    while (currentNodeId && pending.size > 0) {
      const node = await tx.mlmNode.findUnique({
        where: { id: currentNodeId },
      });
      if (!node) break;

      const amount = pending.get(node.rank);
      if (amount !== undefined) {
        await tx.commission.create({
          data: {
            userId: node.userId,
            amount,
            type: rankType[node.rank],
            description: `${node.rank} commission — Gold Card sale`,
            status: 'PENDING',
            saleId: paymentId,
          },
        });
        pending.delete(node.rank); // pay each rank only once
      }

      currentNodeId = node.parentId;
    }
  }

  // ─── List Payments (Admin) ───────────────────────────────────────────────
  async listPayments(query?: { search?: string }) {
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { razorpayPaymentId: { contains: query.search, mode: 'insensitive' } },
        { razorpayOrderId: { contains: query.search, mode: 'insensitive' } },
        { customer: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: query.search } } },
        { goldCard: { cardNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        advisor: { select: { id: true, firstName: true, lastName: true } },
        goldCard: { select: { cardNumber: true, status: true, expiryDate: true } },
        invoice: { select: { invoiceNumber: true } },
      },
    });
  }

  // ─── Advisor's payments ──────────────────────────────────────────────────
  async listMyPayments(advisorId: string) {
    return this.prisma.payment.findMany({
      where: { advisorId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        goldCard: { select: { cardNumber: true, status: true, expiryDate: true } },
        invoice: { select: { invoiceNumber: true } },
      },
    });
  }

  // ─── Single Payment ──────────────────────────────────────────────────────
  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                mlmNode: { select: { id: true, rank: true } },
              },
            },
          },
        },
        advisor: { select: { firstName: true, lastName: true, email: true } },
        goldCard: true,
        invoice: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  // ─── Payment stats (Admin Dashboard) ─────────────────────────────────────
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, pending, failed, captured] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { createdAt: { gte: today } } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.aggregate({
        where: { status: 'CAPTURED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const todayRevenue = await this.prisma.payment.aggregate({
      where: { status: 'CAPTURED', createdAt: { gte: today } },
      _sum: { amount: true },
    });

    return {
      totalPayments: total,
      todayPayments: todayCount,
      pendingPayments: pending,
      failedPayments: failed,
      totalRevenue: captured._sum.amount || 0,
      todayRevenue: todayRevenue._sum.amount || 0,
      capturedCount: captured._count,
    };
  }

  // ─── Handle webhook events ───────────────────────────────────────────────
  async handleWebhookEvent(event: string, payload: any) {
    switch (event) {
      case 'payment.captured': {
        const razorpayPaymentId = payload?.payment?.entity?.id;
        const orderId = payload?.payment?.entity?.order_id;
        if (razorpayPaymentId && orderId) {
          await this.prisma.payment.updateMany({
            where: { razorpayOrderId: orderId },
            data: { status: 'CAPTURED', razorpayPaymentId },
          });
        }
        break;
      }
      case 'payment.failed': {
        const orderId = payload?.payment?.entity?.order_id;
        const reason = payload?.payment?.entity?.error_description;
        if (orderId) {
          await this.prisma.payment.updateMany({
            where: { razorpayOrderId: orderId, status: 'PENDING' },
            data: { status: 'FAILED', failureReason: reason || 'Payment failed' },
          });
        }
        break;
      }
      case 'refund.processed': {
        const orderId = payload?.refund?.entity?.order_id;
        if (orderId) {
          await this.prisma.payment.updateMany({
            where: { razorpayOrderId: orderId },
            data: { status: 'REFUNDED' },
          });
        }
        break;
      }
    }
  }
}
