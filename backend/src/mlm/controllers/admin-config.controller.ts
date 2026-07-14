import { Controller, Get, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('admin-config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/admin-config')
export class AdminConfigController {
  constructor(private prisma: PrismaService) {}

  @Get('joining-fee')
  async getJoiningFee() {
    const config = await this.prisma.joiningFeeConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return config || { amount: 3500, currency: 'INR' };
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get('joining-fee/logs')
  async getJoiningFeeLogs() {
    return this.prisma.joiningFeeLog.findMany({
      orderBy: { changedAt: 'desc' },
    });
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('joining-fee')
  async updateJoiningFee(@Req() req, @Body() body: { amount: number; reason?: string }) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const previousConfig = await this.prisma.joiningFeeConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const prevAmount = previousConfig ? previousConfig.amount : null;

    // Deactivate previous active configurations
    await this.prisma.joiningFeeConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false, effectiveTo: new Date() },
    });

    // Create new active configuration
    const newConfig = await this.prisma.joiningFeeConfig.create({
      data: {
        amount: body.amount,
        currency: 'INR',
        effectiveFrom: new Date(),
        isActive: true,
        setBy: req.user.id,
        reason: body.reason || 'Manual override by admin',
      },
    });

    // Log the change
    await this.prisma.joiningFeeLog.create({
      data: {
        previousAmount: prevAmount,
        newAmount: body.amount,
        changedBy: req.user.id,
        reason: body.reason || 'Manual override',
      },
    });

    return newConfig;
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('appoint-founder')
  async appointFounder(@Req() req, @Body() body: {
    userId: string;
    parentId?: string;
    position?: 'LEFT' | 'RIGHT';
    appointmentFee?: number;
  }) {
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: body.userId },
      include: { mlmNode: true },
    });

    if (!targetUser) {
      throw new BadRequestException('Target user not found');
    }

    const fee = body.appointmentFee !== undefined ? body.appointmentFee : 25900000;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update user role
      await tx.user.update({
        where: { id: body.userId },
        data: { role: 'MLM_DISTRIBUTOR' },
      });

      // 2. Upsert MlmNode, bypass standard rules, promote to Founder Member
      const parentNode = body.parentId
        ? await tx.mlmNode.findUnique({ where: { id: body.parentId } })
        : null;

      await tx.mlmNode.upsert({
        where: { userId: body.userId },
        update: {
          rank: 'Founder Member',
          parentId: parentNode ? parentNode.id : null,
          placementId: parentNode ? parentNode.id : null,
          position: body.position || null,
        },
        create: {
          userId: body.userId,
          rank: 'Founder Member',
          parentId: parentNode ? parentNode.id : null,
          placementId: parentNode ? parentNode.id : null,
          position: body.position || null,
          personalPv: 2000.0,
          groupPv: 1500000.0,
        },
      });

      // 3. Create FounderAppointment log
      await tx.founderAppointment.create({
        data: {
          userId: body.userId,
          appointmentFee: fee,
          paymentStatus: 'COMPLETED',
          appointedBy: req.user.id,
          specialPrivileges: JSON.stringify({ description: 'Direct Super Admin Founder Appointment' }),
        },
      });

      // 4. Initialize FounderTracking
      await tx.founderTracking.upsert({
        where: { userId: body.userId },
        update: {
          exitTriggered: false,
          totalEarnings: 0,
        },
        create: {
          userId: body.userId,
          exitThreshold: 25900000,
          totalEarnings: 0,
        },
      });

      // 5. Release any held commissions
      const heldCommissions = await tx.heldCommission.findMany({
        where: { userId: body.userId, status: 'HELD' },
      });

      if (heldCommissions.length > 0) {
        const sum = heldCommissions.reduce((acc, h) => acc + h.amount, 0);

        for (const held of heldCommissions) {
          await tx.commission.create({
            data: {
              userId: body.userId,
              amount: held.amount,
              type: 'RANK_BONUS',
              description: `Released commission due to direct Founder appointment`,
              status: 'PENDING',
            },
          });
        }

        await tx.heldCommission.updateMany({
          where: { userId: body.userId, status: 'HELD' },
          data: {
            status: 'RELEASED',
            releasedDate: new Date(),
            releaseReason: 'Direct Founder Appointment',
          },
        });

        await tx.commissionRelease.create({
          data: {
            userId: body.userId,
            totalHeldAmount: sum,
            releasedAmount: sum,
            releaseType: 'AUTO_RELEASE',
            triggeredBy: 'ADMIN',
          },
        });
      }

      // 6. Create notifications
      await tx.notification.create({
        data: {
          userId: body.userId,
          title: 'Appointed as Founder Member 👑',
          message: 'You have been directly appointed as a Founder Member by the Super Admin.',
          type: 'PROMOTION',
        },
      });
    });

    return { success: true, message: 'Founder appointed successfully' };
  }
}
