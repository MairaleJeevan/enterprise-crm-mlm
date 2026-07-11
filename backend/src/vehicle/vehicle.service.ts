import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        OR: [
          { licensePlate: dto.licensePlate },
          dto.vin ? { vin: dto.vin } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (existing) {
      throw new ConflictException('Vehicle with this license plate or VIN already exists');
    }

    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    return this.prisma.vehicle.create({
      data: dto,
      include: { customer: true },
    });
  }

  async findAll() {
    return this.prisma.vehicle.findMany({
      include: { customer: true },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async update(id: string, dto: Partial<CreateVehicleDto>) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
      include: { customer: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
