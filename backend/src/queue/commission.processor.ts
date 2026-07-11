import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

@Processor('sales')
export class CommissionProcessor {
  constructor(private prisma: PrismaService) {}

  @Process('processSale')
  async handleProcessSale(job: Job<{ saleId: string }>) {
    const { saleId } = job.data;
    console.log(`[Queue Processor] Processing sale ${saleId}...`);

    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        user: { include: { mlmNode: true } },
        customer: true,
      },
    });

    if (!sale) {
      console.error(`[Queue Processor] Sale ${saleId} not found`);
      return;
    }

    // 1. Process Inventory Deductions and Stock Alerts
    for (const item of sale.items) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (inventory) {
        const newQty = Math.max(0, inventory.quantity - item.quantity);
        await this.prisma.inventory.update({
          where: { productId: item.productId },
          data: { quantity: newQty, lastUpdated: new Date() },
        });

        if (newQty <= inventory.reorderLevel) {
          console.warn(
            `⚠️  [Stock Alert] Product ID ${item.productId} has low stock: ${newQty} remaining (reorder level: ${inventory.reorderLevel})`
          );
        }
      }
    }

    // 2. MLM Commission & Sales Volume (PV/GV) Calculations
    if (sale.user && sale.user.role === 'MLM_DISTRIBUTOR') {
      const distributor = sale.user;
      
      if (distributor.mlmNode) {
        const node = distributor.mlmNode;
        const volumeAmount = sale.subtotal;

        // Update Personal PV
        await this.prisma.mlmNode.update({
          where: { id: node.id },
          data: {
            personalPv: { increment: volumeAmount },
            groupPv: { increment: volumeAmount },
          },
        });

        // Pay Direct Sponsor Commission (10% of subtotal) to Direct Parent / Recruiter
        if (node.parentId) {
          const sponsorNode = await this.prisma.mlmNode.findUnique({
            where: { id: node.parentId },
          });

          if (sponsorNode) {
            const directCommission = volumeAmount * 0.10;
            await this.prisma.commission.create({
              data: {
                userId: sponsorNode.userId,
                amount: directCommission,
                type: 'DIRECT_SPONSOR',
                description: `10% direct sponsor commission from Sale #${sale.invoiceNumber} by ${distributor.firstName}`,
                status: 'PENDING',
                saleId: sale.id,
              },
            });
            console.log(`[Queue Processor] Commission of $${directCommission} awarded to sponsor user ${sponsorNode.userId}`);
          }
        }

        // Walk Upline and update Group Volume and Leg volumes (Binary)
        let currentNode = node;
        const visitedIds = new Set<string>([currentNode.id]);

        while (currentNode.parentId) {
          const parentId = currentNode.parentId;
          if (visitedIds.has(parentId)) {
            console.warn('[Queue Processor] Circular hierarchy loop detected!');
            break;
          }
          visitedIds.add(parentId);

          const parentNode = await this.prisma.mlmNode.findUnique({
            where: { id: parentId },
          });

          if (!parentNode) break;

          // Binary leg attribution
          const isLeft = currentNode.position === 'LEFT';
          const updateData: any = {
            groupPv: { increment: volumeAmount },
          };

          if (isLeft) {
            updateData.leftPv = { increment: volumeAmount };
          } else if (currentNode.position === 'RIGHT') {
            updateData.rightPv = { increment: volumeAmount };
          }

          const updatedParent = await this.prisma.mlmNode.update({
            where: { id: parentId },
            data: updateData,
          });

          // Binary Pair Matching Check (100 PV Left and 100 PV Right matching pays 10% matching commission)
          const latestLeft = updatedParent.leftPv;
          const latestRight = updatedParent.rightPv;
          const matchUnits = Math.floor(Math.min(latestLeft, latestRight) / 100) * 100;

          if (matchUnits >= 100) {
            const matchBonus = matchUnits * 0.10; // 10% bonus
            await this.prisma.$transaction([
              this.prisma.mlmNode.update({
                where: { id: parentId },
                data: {
                  leftPv: { decrement: matchUnits },
                  rightPv: { decrement: matchUnits },
                },
              }),
              this.prisma.commission.create({
                data: {
                  userId: updatedParent.userId,
                  amount: matchBonus,
                  type: 'BINARY_MATCH',
                  description: `Binary pairing match of ${matchUnits} PV under distributor tree`,
                  status: 'PENDING',
                  saleId: sale.id,
                },
              }),
            ]);
            console.log(`[Queue Processor] Binary matching bonus of $${matchBonus} awarded to user ${updatedParent.userId} (Matched ${matchUnits} PV)`);
          }

          currentNode = parentNode;
        }
      }
    }

    // 3. Customer Loyalty / Gold Membership Upgrade logic
    const allSales = await this.prisma.sale.findMany({
      where: { customerId: sale.customerId, paymentStatus: 'PAID' },
    });
    
    const totalSpent = allSales.reduce((sum, s) => sum + s.total, 0);

    if (totalSpent >= 1000 && !sale.customer.isGoldMember) {
      const goldCardId = `GOLD-${sale.customer.phone.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
      await this.prisma.customer.update({
        where: { id: sale.customerId },
        data: {
          isGoldMember: true,
          goldCardId,
        },
      });
      console.log(`🎉 [Customer Upgrade] Customer upgraded to Gold Member! Card ID: ${goldCardId}`);
    }

    console.log(`[Queue Processor] Completed processing for sale ${saleId}`);
  }
}
