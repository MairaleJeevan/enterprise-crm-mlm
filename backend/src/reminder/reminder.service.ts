import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReminderDto) {
    return this.prisma.reminder.create({
      data: {
        title: dto.title,
        description: dto.description,
        remindAt: new Date(dto.remindAt),
        isCompleted: dto.isCompleted || false,
      },
    });
  }

  async findAll() {
    return this.prisma.reminder.findMany({
      orderBy: { remindAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
    });
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }
    return reminder;
  }

  async update(id: string, dto: Partial<CreateReminderDto>) {
    await this.findOne(id);
    return this.prisma.reminder.update({
      where: { id },
      data: {
        ...dto,
        remindAt: dto.remindAt ? new Date(dto.remindAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.reminder.delete({
      where: { id },
    });
  }
}
