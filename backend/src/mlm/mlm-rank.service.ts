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
    }

    // Propagate upward so parent ranks also get re-evaluated
    if (node.parentId) {
      await this.checkAndUpgradeRank(tx, node.parentId);
    }
  }
}
