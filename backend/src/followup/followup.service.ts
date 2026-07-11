import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowUpDto } from './dto/create-followup.dto';

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFollowUpDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.followUp.create({
      data: {
        customerId: dto.customerId,
        notes: dto.notes,
        followUpDate: new Date(dto.followUpDate),
        status: dto.status || 'PENDING',
      },
      include: { customer: true },
    });
  }

  async findAll() {
    return this.prisma.followUp.findMany({
      include: { customer: true },
      orderBy: { followUpDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.followUp.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!log) {
      throw new NotFoundException('Follow-up record not found');
    }
    return log;
  }

  async update(id: string, dto: Partial<CreateFollowUpDto>) {
    await this.findOne(id);
    return this.prisma.followUp.update({
      where: { id },
      data: {
        ...dto,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
      include: { customer: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.followUp.delete({
      where: { id },
    });
  }
}
