import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesCsv(): Promise<string> {
    const sales = await this.prisma.sale.findMany({
      include: {
        customer: true,
        franchise: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Franchise Name',
      'Subtotal',
      'Tax',
      'Total',
      'Payment Status',
    ];

    const rows = sales.map((sale) => [
      sale.invoiceNumber,
      new Date(sale.saleDate).toLocaleDateString(),
      sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName || ''}`.trim() : 'Guest',
      sale.franchise?.name || 'N/A',
      sale.subtotal.toFixed(2),
      sale.tax.toFixed(2),
      sale.total.toFixed(2),
      sale.paymentStatus,
    ]);

    return [headers.join(','), ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
  }

  async getInventoryCsv(): Promise<string> {
    const inventories = await this.prisma.inventory.findMany({
      include: {
        product: true,
        franchise: true,
      },
      orderBy: { quantity: 'asc' },
    });

    const headers = ['Product Name', 'SKU', 'Franchise Name', 'Stock Quantity', 'Reorder Level', 'Location'];

    const rows = inventories.map((inv) => [
      inv.product.name,
      inv.product.sku,
      inv.franchise?.name || 'N/A',
      inv.quantity.toString(),
      inv.reorderLevel.toString(),
      inv.location || 'N/A',
    ]);

    return [headers.join(','), ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
  }

  async getCommissionsCsv(): Promise<string> {
    const commissions = await this.prisma.commission.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Distributor Name', 'Distributor Email', 'Amount', 'Type', 'Status', 'Description', 'Date'];

    const rows = commissions.map((comm) => [
      `${comm.user.firstName} ${comm.user.lastName || ''}`.trim(),
      comm.user.email,
      comm.amount.toFixed(2),
      comm.type,
      comm.status,
      comm.description || '',
      new Date(comm.createdAt).toLocaleDateString(),
    ]);

    return [headers.join(','), ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
  }
}
