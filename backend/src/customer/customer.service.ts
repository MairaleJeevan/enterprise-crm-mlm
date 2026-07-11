import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    if (dto.franchiseId) {
      const franchise = await this.prisma.franchise.findUnique({
        where: { id: dto.franchiseId },
      });
      if (!franchise) {
        throw new NotFoundException('Franchise not found');
      }
    }

    return this.prisma.customer.create({
      data: dto,
    });
  }

  async findAll(franchiseId?: string) {
    return this.prisma.customer.findMany({
      where: franchiseId ? { franchiseId } : {},
      include: {
        franchise: {
          select: { name: true, code: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        franchise: true,
        sales: {
          orderBy: { saleDate: 'desc' },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>) {
    await this.findOne(id);
    if (dto.franchiseId) {
      const franchise = await this.prisma.franchise.findUnique({
        where: { id: dto.franchiseId },
      });
      if (!franchise) {
        throw new NotFoundException('Franchise not found');
      }
    }
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
