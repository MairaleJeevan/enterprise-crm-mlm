import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';

@Injectable()
export class FranchiseService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFranchiseDto) {
    const existing = await this.prisma.franchise.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Franchise code already exists');
    }

    return this.prisma.franchise.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.franchise.findMany({
      include: {
        _count: {
          select: { users: true, customers: true, products: true, sales: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }
    return franchise;
  }

  async update(id: string, dto: Partial<CreateFranchiseDto>) {
    await this.findOne(id);
    if (dto.code) {
      const existing = await this.prisma.franchise.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Franchise code already in use');
      }
    }
    return this.prisma.franchise.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.franchise.delete({
      where: { id },
    });
  }
}
