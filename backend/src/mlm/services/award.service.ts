import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AwardService {
  constructor(private prisma: PrismaService) {}

  async getMyAwards(userId: string) {
    const memberAwards = await this.prisma.memberAward.findMany({
      where: { userId },
      include: {
        award: true,
      },
      orderBy: { achievedDate: 'desc' },
    });
    return memberAwards;
  }

  async getAllAwards() {
    return this.prisma.award.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Evaluates if a user has hit any milestones (Bronze, Silver, Gold, Platinum, Diamond)
   * and automatically awards them.
   */
  async checkAndGrantMilestones(userId: string) {
    // 1. Get user's direct downline count
    const node = await this.prisma.mlmNode.findUnique({
      where: { userId },
      include: { children: true },
    });

    if (!node) return;

    const directCount = node.children.length;

    // 2. Get user's total downline size (recursive)
    const teamCount = await this.calculateTeamSize(node.id);

    // 3. Fetch all active awards
    const awards = await this.prisma.award.findMany({
      where: { isActive: true },
    });

    // 4. Fetch user's existing awards
    const existingAwards = await this.prisma.memberAward.findMany({
      where: { userId },
      select: { awardId: true },
    });
    const achievedIds = new Set(existingAwards.map((a) => a.awardId));

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
        // Grant Award
        const rand = Math.floor(100000 + Math.random() * 900000);
        const certificateNumber = `CERT-AWD-${new Date().getFullYear()}-${rand}`;

        await this.prisma.memberAward.create({
          data: {
            userId,
            awardId: award.id,
            certificateNumber,
            status: 'EARNED',
            achievedDate: new Date(),
          },
        });

        // If it's a cash bonus, automatically credit to commissions
        if (award.type === 'Cash' && award.value) {
          await this.prisma.commission.create({
            data: {
              userId,
              amount: award.value,
              type: 'RANK_BONUS',
              description: `Cash award bonus for achieving: ${award.name}`,
              status: 'PENDING',
            },
          });
        }

        // Send Notification
        await this.prisma.notification.create({
          data: {
            userId,
            title: `Award Achieved! 🏆`,
            message: `Congratulations! You have earned the "${award.name}" milestone award.`,
            type: 'PROMOTION',
          },
        });

        console.log(`[AwardService] User ${userId} granted award: ${award.name}`);
      }
    }
  }

  private async calculateTeamSize(nodeId: string): Promise<number> {
    const children = await this.prisma.mlmNode.findMany({
      where: { parentId: nodeId },
      select: { id: true },
    });

    let count = children.length;
    for (const child of children) {
      count += await this.calculateTeamSize(child.id);
    }
    return count;
  }
}
