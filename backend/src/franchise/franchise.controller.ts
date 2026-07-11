import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FranchiseService } from './franchise.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('franchises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/franchises')
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateFranchiseDto) {
    return this.franchiseService.create(dto);
  }

  @Get()
  findAll() {
    return this.franchiseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.franchiseService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFranchiseDto>) {
    return this.franchiseService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.franchiseService.remove(id);
  }
}
