import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool, { schema: 'enterprise' });
  return new PrismaClient({ adapter } as any);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool, { schema: 'enterprise' });
    super({ adapter } as any);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
