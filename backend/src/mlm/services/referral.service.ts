import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  async getReferralDashboard(userId: string) {
    let referral = await this.prisma.referral.findUnique({
      where: { userId },
    });

    // If referral data doesn't exist for some reason, create it on-demand
    if (!referral) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      // Generate code if missing
      const refCode = user.referralCode || this.generateReferralCode();
      
      // Update user with referral code if missing
      if (!user.referralCode) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: refCode },
        });
      }

      const clientUrl = `https://enterprise-crm-mlm.vercel.app/login?ref=${refCode}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(clientUrl)}`;

      referral = await this.prisma.referral.create({
        data: {
          userId,
          referralCode: refCode,
          qrCode,
          totalReferrals: 0,
          successfulReferrals: 0,
          referralEarnings: 0,
        },
      });
    }

    const history = await this.prisma.referralHistory.findMany({
      where: { referralId: referral.id },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch details of referred users
    const historyWithDetails = await Promise.all(
      history.map(async (h) => {
        const referredUser = await this.prisma.user.findUnique({
          where: { id: h.referredMemberId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            kycStatus: true,
          },
        });
        return {
          ...h,
          referredUser,
        };
      }),
    );

    return {
      ...referral,
      history: historyWithDetails,
    };
  }

  generateReferralCode(): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `REF-${year}-${rand}`;
  }

  async trackReferralSignup(referrerId: string, referredMemberId: string) {
    let referral = await this.prisma.referral.findUnique({
      where: { userId: referrerId },
    });

    if (!referral) {
      const user = await this.prisma.user.findUnique({ where: { id: referrerId } });
      if (user) {
        const refCode = user.referralCode || this.generateReferralCode();
        if (!user.referralCode) {
          await this.prisma.user.update({ where: { id: referrerId }, data: { referralCode: refCode } });
        }
        const clientUrl = `https://enterprise-crm-mlm.vercel.app/login?ref=${refCode}`;
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(clientUrl)}`;
        
        referral = await this.prisma.referral.create({
          data: {
            userId: referrerId,
            referralCode: refCode,
            qrCode,
          },
        });
      }
    }

    if (referral) {
      // Create history record
      await this.prisma.referralHistory.create({
        data: {
          referralId: referral.id,
          referredMemberId,
          status: 'PENDING',
          commissionAmount: 0.0, // Credited when they buy a Gold Card
        },
      });

      // Update total referrals count
      await this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          totalReferrals: { increment: 1 },
        },
      });
    }
  }

  async trackReferralConversion(referredMemberId: string) {
    // Find if this member was referred
    const history = await this.prisma.referralHistory.findFirst({
      where: { referredMemberId, status: 'PENDING' },
    });

    if (history) {
      const commissionAmount = 500.0; // Flat ₹500 referral credit

      await this.prisma.referralHistory.update({
        where: { id: history.id },
        data: {
          status: 'PAID',
          commissionAmount,
        },
      });

      const referral = await this.prisma.referral.findUnique({
        where: { id: history.referralId },
      });

      if (referral) {
        await this.prisma.referral.update({
          where: { id: referral.id },
          data: {
            successfulReferrals: { increment: 1 },
            referralEarnings: { increment: commissionAmount },
          },
        });

        // Add standard Commission record for referrer
        await this.prisma.commission.create({
          data: {
            userId: referral.userId,
            amount: commissionAmount,
            type: 'DIRECT_SPONSOR',
            description: `Referral bonus for sponsoring member ID ${referredMemberId.slice(-8)}`,
            status: 'PENDING',
          },
        });

        // Create Notification for the referrer
        await this.prisma.notification.create({
          data: {
            userId: referral.userId,
            title: 'Referral Bonus Earned! 💰',
            message: `You earned a flat ₹${commissionAmount} bonus as your referral completed their onboarding payment.`,
            type: 'COMMISSION',
          },
        });
      }
    }
  }
}
