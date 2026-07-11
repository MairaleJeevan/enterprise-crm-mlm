import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateSaleDto) {
    return this.saleService.create(req.user.id, dto);
  }

  @Get()
  findAll(
    @Query('franchiseId') franchiseId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.saleService.findAll(franchiseId, customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleService.findOne(id);
  }
}
