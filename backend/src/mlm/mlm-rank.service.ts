import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Shared service for MLM rank evaluation logic.
 *
 * Rank thresholds (based on direct children count & qualifying rank):
 *   Sales Advisor  → default (assigned on Gold Card purchase)
 *   Team Leader    → 30 direct members (any rank)
 *   Team Manager   → 30 direct members who are TL or above
 *   Founder Member → 30 direct members who are Team Manager or above
 *
 * Used by both PaymentService (Gold Card flow) and AuthService (manual registration).
 */
@Injectable()
export class MlmRankService {
  constructor(private prisma: PrismaService) {}

  /**
   * Re-evaluate and potentially upgrade the rank of a given MLM node.
   * Propagates upward so parent ranks also get re-evaluated.
   *
   * @param tx  A Prisma transaction client (or the root PrismaService)
   * @param nodeId  The MlmNode.id to evaluate
   */
  async checkAndUpgradeRank(tx: any, nodeId: string): Promise<void> {
    const node = await tx.mlmNode.findUnique({
      where: { id: nodeId },
      include: { children: true },
    });
    if (!node) return;

    const directCount = node.children.length;
    const directTLsOrAbove = node.children.filter(
      (c: any) =>
        c.rank === 'Team Leader (TL)' ||
        c.rank === 'Team Manager' ||
        c.rank === 'Founder Member',
    ).length;
    const directTMsOrAbove = node.children.filter(
      (c: any) =>
        c.rank === 'Team Manager' ||
        c.rank === 'Founder Member',
    ).length;

    let newRank = 'Sales Advisor';
    if (directTMsOrAbove >= 30) {
      newRank = 'Founder Member';
    } else if (directTLsOrAbove >= 30) {
      newRank = 'Team Manager';
    } else if (directCount >= 30) {
      newRank = 'Team Leader (TL)';
    }

    if (newRank !== node.rank) {
      await tx.mlmNode.update({
        where: { id: nodeId },
        data: { rank: newRank },
      });
      console.log(
        `[MlmRankService] Node ${nodeId} promoted from "${node.rank}" → "${newRank}"`,
      );

      // Trigger held commissions release
      await this.releaseHeldCommissions(tx, node.userId, newRank);
    }

    // Evaluate Milestone Awards whenever rank/structure is re-evaluated
    await this.evaluateAwards(tx, node.userId);

    // Propagate upward so parent ranks also get re-evaluated
    if (node.parentId) {
      await this.checkAndUpgradeRank(tx, node.parentId);
    }
  }

  private async releaseHeldCommissions(tx: any, userId: string, newRank: string) {
    const held = await tx.heldCommission.findMany({
      where: { userId, status: 'HELD' },
    });

    if (held.length === 0) return;

    const totalReleased = held.reduce((acc: number, item: any) => acc + item.amount, 0);

    // Convert held commissions into standard commissions
    for (const h of held) {
      await tx.commission.create({
        data: {
          userId,
          amount: h.amount,
          type: 'RANK_BONUS',
          description: `Released commission from rank upgrade to ${newRank}`,
          status: 'PENDING',
        },
      });
    }

    // Mark as released
    await tx.heldCommission.updateMany({
      where: { userId, status: 'HELD' },
      data: {
        status: 'RELEASED',
        releasedDate: new Date(),
        releaseReason: `Auto-released on promotion to ${newRank}`,
      },
    });

    // Log the release trigger
    await tx.commissionRelease.create({
      data: {
        userId,
        totalHeldAmount: totalReleased,
        releasedAmount: totalReleased,
        releaseType: 'AUTO_RELEASE',
        triggeredBy: 'SYSTEM',
      },
    });

    // Create Notification for the user
    await tx.notification.create({
      data: {
        userId,
        title: 'Commissions Released! 🔓',
        message: `Congratulations on your promotion to ${newRank}! All held commissions of ₹${totalReleased.toFixed(2)} have been released.`,
        type: 'COMMISSION',
      },
    });

    // If promoted to Founder, initialize tracking
    if (newRank === 'Founder Member') {
      await tx.founderTracking.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          exitThreshold: 25900000,
          totalEarnings: 0,
        },
      });
    }
  }

  private async evaluateAwards(tx: any, userId: string) {
    const node = await tx.mlmNode.findUnique({
      where: { userId },
      include: { children: true },
    });
    if (!node) return;

    const directCount = node.children.length;
    const teamCount = await this.calculateTeamSize(tx, node.id);

    const awards = await tx.award.findMany({ where: { isActive: true } });
    const existing = await tx.memberAward.findMany({
      where: { userId },
      select: { awardId: true },
    });
    const achievedIds = new Set(existing.map((a: any) => a.awardId));

    for (const award of awards) {
      if (achievedIds.has(award.id)) continue;

      let criteria: any = {};
      try {
        criteria = JSON.parse(award.criteria || '{}');
      } catch {
        continue;
      }

      let isQualified = false;
      if (criteria.directCount !== undefined && directCount >= criteria.directCount) {
        isQualified = true;
      }
      if (criteria.teamCount !== undefined && teamCount >= criteria.teamCount) {
        isQualified = true;
      }

      if (isQualified) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        const certificateNumber = `CERT-AWD-${new Date().getFullYear()}-${rand}`;

        await tx.memberAward.create({
          data: {
            userId,
            awardId: award.id,
            certificateNumber,
            status: 'EARNED',
            achievedDate: new Date(),
          },
        });

        if (award.type === 'Cash' && award.value) {
          await tx.commission.create({
            data: {
              userId,
              amount: award.value,
              type: 'RANK_BONUS',
              description: `Cash award bonus for achieving: ${award.name}`,
              status: 'PENDING',
            },
          });
        }

        await tx.notification.create({
          data: {
            userId,
            title: `Award Achieved! 🏆`,
            message: `Congratulations! You have earned the "${award.name}" milestone award.`,
            type: 'PROMOTION',
          },
        });
      }
    }
  }

  private async calculateTeamSize(tx: any, nodeId: string): Promise<number> {
    const children = await tx.mlmNode.findMany({
      where: { parentId: nodeId },
      select: { id: true },
    });

    let count = children.length;
    for (const child of children) {
      count += await this.calculateTeamSize(tx, child.id);
    }
    return count;
  }
}
