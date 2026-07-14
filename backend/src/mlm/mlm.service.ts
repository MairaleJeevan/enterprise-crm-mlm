import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MlmService {
  constructor(private prisma: PrismaService) {}

  async getTree(userId: string, depth = 4) {
    const rootUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mlmNode: true },
    });

    if (!rootUser || !rootUser.mlmNode) {
      // Find the first admin node to show a default root tree if none found
      const adminNode = await this.prisma.mlmNode.findFirst({
        include: { user: true },
      });
      if (adminNode) {
        return this.buildTreeRecursive(adminNode.id, depth);
      }
      throw new NotFoundException('MLM Node not found for this user');
    }

    return this.buildTreeRecursive(rootUser.mlmNode.id, depth);
  }

  private async buildTreeRecursive(nodeId: string, depth: number): Promise<any> {
    const node = await this.prisma.mlmNode.findUnique({
      where: { id: nodeId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!node) return null;

    const result = {
      id: node.id,
      userId: node.userId,
      name: `${node.user.firstName} ${node.user.lastName || ''}`.trim(),
      email: node.user.email,
      rank: node.rank,
      personalPv: node.personalPv,
      groupPv: node.groupPv,
      leftPv: node.leftPv,
      rightPv: node.rightPv,
      position: node.position,
      children: [],
    };

    if (depth > 0) {
      const childrenNodes = await this.prisma.mlmNode.findMany({
        where: { parentId: nodeId },
        select: { id: true },
      });

      for (const childNode of childrenNodes) {
        const childTree = await this.buildTreeRecursive(childNode.id, depth - 1);
        if (childTree) {
          result.children.push(childTree);
        }
      }
    }

    return result;
  }

  async getDownline(userId: string) {
    const rootNode = await this.prisma.mlmNode.findUnique({
      where: { userId },
    });

    if (!rootNode) {
      throw new NotFoundException('MLM Node not found');
    }

    return this.prisma.mlmNode.findMany({
      where: { parentId: rootNode.id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async getCommissions(userId: string) {
    return this.prisma.commission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayouts(userId: string) {
    return this.prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayout(userId: string) {
    const pendingCommissions = await this.prisma.commission.findMany({
      where: { userId, status: 'PENDING' },
    });

    if (pendingCommissions.length === 0) {
      throw new BadRequestException('No pending commissions available to cash out');
    }

    const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          userId,
          amount: totalAmount,
          status: 'PAID',
          processedAt: new Date(),
        },
      });

      await tx.commission.updateMany({
        where: {
          userId,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
        },
      });

      return payout;
    });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async getHeldCommissions(userId: string) {
    const held = await this.prisma.heldCommission.findMany({
      where: { userId },
      orderBy: { heldDate: 'desc' },
    });
    const totalHeld = held.filter(h => h.status === 'HELD').reduce((acc, h) => acc + h.amount, 0);
    const totalReleased = held.filter(h => h.status === 'RELEASED').reduce((acc, h) => acc + h.amount, 0);

    return {
      heldCommissions: held,
      totalHeld,
      totalReleased,
    };
  }
}
