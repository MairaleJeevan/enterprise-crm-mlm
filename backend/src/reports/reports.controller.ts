import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async exportSales(@Res() res: Response) {
    const csv = await this.reportsService.getSalesCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
    return res.status(200).send(csv);
  }

  @Get('inventory')
  async exportInventory(@Res() res: Response) {
    const csv = await this.reportsService.getInventoryCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.csv');
    return res.status(200).send(csv);
  }

  @Get('commissions')
  async exportCommissions(@Res() res: Response) {
    const csv = await this.reportsService.getCommissionsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=commissions_report.csv');
    return res.status(200).send(csv);
  }
}
