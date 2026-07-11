import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool, { schema: 'enterprise' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing records in enterprise schema
  await prisma.commission.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.mlmNode.deleteMany({});
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.storeUser.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.franchise.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Franchise
  const franchise = await prisma.franchise.create({
    data: {
      name: 'Main Showroom',
      code: 'MSW01',
      type: 'SHOWROOM',
      address: '123 Main Street',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      pincode: '98101',
      phone: '1234567890',
      email: 'showroom@vortex.com',
      gstNumber: 'GST-998877',
    },
  });
  console.log('✅ Franchise created');

  // 2. Create Categories
  const electronics = await prisma.category.create({
    data: { name: 'Electronics', description: 'Gadgets and gear' },
  });
  const apparel = await prisma.category.create({
    data: { name: 'Apparel', description: 'Clothing and wear' },
  });
  console.log('✅ Categories created');

  // 3. Create Products and initial Inventory
  await prisma.product.create({
    data: {
      sku: 'PROD-PHONE-01',
      name: 'Vortex Phone X',
      description: 'High-end smartphone',
      categoryId: electronics.id,
      franchiseId: franchise.id,
      purchasePrice: 400.0,
      sellingPrice: 799.0,
      taxRate: 0.18,
      unit: 'PCS',
      inventory: {
        create: {
          franchiseId: franchise.id,
          quantity: 50,
          reorderLevel: 5,
          location: 'Aisle 3A',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      sku: 'PROD-SHIRT-02',
      name: 'Vortex Tech Tee',
      description: 'Breathable sports tee',
      categoryId: apparel.id,
      franchiseId: franchise.id,
      purchasePrice: 12.0,
      sellingPrice: 29.99,
      taxRate: 0.12,
      unit: 'PCS',
      inventory: {
        create: {
          franchiseId: franchise.id,
          quantity: 120,
          reorderLevel: 15,
          location: 'Rack 1B',
        },
      },
    },
  });
  console.log('✅ Products and inventory created');

  // 4. Create Users
  // Admin User
  await prisma.user.create({
    data: {
      email: 'admin@vortex.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  // Cashier User
  await prisma.user.create({
    data: {
      email: 'cashier@vortex.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Cashier',
      role: 'STORE_USER',
      storeUsers: {
        create: {
          franchiseId: franchise.id,
          role: 'CASHIER',
        },
      },
    },
  });

  // MLM Root Distributor User
  const mlmRoot = await prisma.user.create({
    data: {
      email: 'root@vortex.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Root',
      role: 'MLM_DISTRIBUTOR',
      mlmNode: {
        create: {
          rank: 'Sales Advisor',
          personalPv: 500,
          groupPv: 2500,
          leftPv: 1200,
          rightPv: 1300,
        },
      },
    },
  });

  const rootNode = await prisma.mlmNode.findUnique({
    where: { userId: mlmRoot.id },
  });

  // MLM Child 1 User (Sponsor: Root, Leg: LEFT)
  await prisma.user.create({
    data: {
      email: 'left@vortex.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Left',
      role: 'MLM_DISTRIBUTOR',
      mlmNode: {
        create: {
          parentId: rootNode?.id,
          placementId: rootNode?.id,
          position: 'LEFT',
          rank: 'Sales Advisor',
          personalPv: 100,
          groupPv: 500,
        },
      },
    },
  });

  // MLM Child 2 User (Sponsor: Root, Leg: RIGHT)
  await prisma.user.create({
    data: {
      email: 'right@vortex.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Right',
      role: 'MLM_DISTRIBUTOR',
      mlmNode: {
        create: {
          parentId: rootNode?.id,
          placementId: rootNode?.id,
          position: 'RIGHT',
          rank: 'Sales Advisor',
          personalPv: 150,
          groupPv: 150,
        },
      },
    },
  });

  console.log('✅ Users & MLM Nodes created');

  // 5. Create Customer
  await prisma.customer.create({
    data: {
      firstName: 'David',
      lastName: 'Customer',
      phone: '9876543210',
      email: 'david@gmail.com',
      franchiseId: franchise.id,
      isGoldMember: false,
    },
  });
  console.log('✅ Customer created');

  console.log('🌱 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
