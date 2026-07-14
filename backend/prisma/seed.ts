import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: 'enterprise' });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing records in enterprise schema
  await prisma.notification.deleteMany({});
  await prisma.welcomeCallSchedule.deleteMany({});
  await prisma.joiningFeeLog.deleteMany({});
  await prisma.joiningFeeConfig.deleteMany({});
  await prisma.founderAppointment.deleteMany({});
  await prisma.memberAward.deleteMany({});
  await prisma.award.deleteMany({});
  await prisma.referralHistory.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.founderTracking.deleteMany({});
  await prisma.commissionRelease.deleteMany({});
  await prisma.heldCommission.deleteMany({});
  await prisma.memberKYC.deleteMany({});
  await prisma.commission.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.mlmNode.deleteMany({});
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // Delete payment-related items before deleting Customer/User
  await prisma.goldInvoice.deleteMany({});
  await prisma.goldCard.deleteMany({});
  await prisma.payment.deleteMany({});

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

  // ── LEVEL 1 under Root: Bob (LEFT) & Founder Anita (RIGHT) ──────────
  const bobUser = await prisma.user.create({
    data: {
      email: 'left@vortex.com', password: hashedPassword,
      firstName: 'Bob', lastName: 'Left', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: rootNode?.id, placementId: rootNode?.id, position: 'LEFT', rank: 'Sales Advisor', personalPv: 100, groupPv: 500 } },
    },
  });
  const bobNode = await prisma.mlmNode.findUnique({ where: { userId: bobUser.id } });

  await prisma.user.create({
    data: {
      email: 'founder@vortex.com', password: hashedPassword,
      firstName: 'Anita', lastName: 'Singh', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: rootNode?.id, placementId: rootNode?.id, position: 'RIGHT', rank: 'Founder Member', personalPv: 2000, groupPv: 1500000 } },
    },
  });

  // ── LEVEL 2 under Bob: Team Leader Priya (LEFT) & Charlie (RIGHT) ────
  const priyaUser = await prisma.user.create({
    data: {
      email: 'teamleader@vortex.com', password: hashedPassword,
      firstName: 'Priya', lastName: 'Verma', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: bobNode?.id, placementId: bobNode?.id, position: 'LEFT', rank: 'Team Leader', personalPv: 500, groupPv: 15000 } },
    },
  });
  const priyaNode = await prisma.mlmNode.findUnique({ where: { userId: priyaUser.id } });

  await prisma.user.create({
    data: {
      email: 'right@vortex.com', password: hashedPassword,
      firstName: 'Charlie', lastName: 'Right', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: bobNode?.id, placementId: bobNode?.id, position: 'RIGHT', rank: 'Sales Advisor', personalPv: 150, groupPv: 150 } },
    },
  });

  // ── LEVEL 3 under Priya: Team Manager Suresh (LEFT) & Ravi (RIGHT) ───
  const sureshUser = await prisma.user.create({
    data: {
      email: 'manager@vortex.com', password: hashedPassword,
      firstName: 'Suresh', lastName: 'Kumar', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: priyaNode?.id, placementId: priyaNode?.id, position: 'LEFT', rank: 'Team Manager', personalPv: 1000, groupPv: 450000 } },
    },
  });
  const sureshNode = await prisma.mlmNode.findUnique({ where: { userId: sureshUser.id } });

  await prisma.user.create({
    data: {
      email: 'advisor@vortex.com', password: hashedPassword,
      firstName: 'Ravi', lastName: 'Sharma', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: priyaNode?.id, placementId: priyaNode?.id, position: 'RIGHT', rank: 'Sales Advisor', personalPv: 80, groupPv: 80 } },
    },
  });

  // ── LEVEL 4 under Suresh: 2 Sales Advisors ───────────────────────────
  await prisma.user.create({
    data: {
      email: 'sa1@vortex.com', password: hashedPassword,
      firstName: 'Deepa', lastName: 'Nair', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: sureshNode?.id, placementId: sureshNode?.id, position: 'LEFT', rank: 'Sales Advisor', personalPv: 60, groupPv: 60 } },
    },
  });

  await prisma.user.create({
    data: {
      email: 'sa2@vortex.com', password: hashedPassword,
      firstName: 'Amit', lastName: 'Patel', role: 'MLM_DISTRIBUTOR',
      mlmNode: { create: { parentId: sureshNode?.id, placementId: sureshNode?.id, position: 'RIGHT', rank: 'Sales Advisor', personalPv: 45, groupPv: 45 } },
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

  // 6. Create Joining Fee Configuration
  await prisma.joiningFeeConfig.create({
    data: {
      amount: 3500,
      currency: 'INR',
      effectiveFrom: new Date(),
      isActive: true,
      reason: 'Initial setup of default joining fee',
      setBy: 'admin',
    },
  });
  console.log('✅ Joining Fee Config created');

  // 7. Create Default Awards & Milestones
  await prisma.award.createMany({
    data: [
      {
        name: 'Bronze Performance Milestone',
        description: 'Personally recruit 5 direct downline members.',
        category: 'Milestone',
        type: 'Trophy',
        value: 0,
        criteria: JSON.stringify({ milestone: 'Bronze', directCount: 5 }),
        isActive: true,
      },
      {
        name: 'Silver Performance Milestone',
        description: 'Personally recruit 15 direct downline members.',
        category: 'Milestone',
        type: 'Voucher',
        value: 5000,
        criteria: JSON.stringify({ milestone: 'Silver', directCount: 15 }),
        isActive: true,
      },
      {
        name: 'Gold Leadership Trophy',
        description: 'Personally recruit 30 direct downline members (Team Leader promotion).',
        category: 'Milestone',
        type: 'Electronic',
        value: 25000,
        criteria: JSON.stringify({ milestone: 'Gold', directCount: 30 }),
        isActive: true,
      },
      {
        name: 'Platinum Excellence Payout',
        description: 'Develop a total organizational team size of 100 members.',
        category: 'Milestone',
        type: 'Cash',
        value: 100000,
        criteria: JSON.stringify({ milestone: 'Platinum', teamCount: 100 }),
        isActive: true,
      },
      {
        name: 'Diamond Recognition & Luxury Trip',
        description: 'Develop a total organizational team size of 500 members.',
        category: 'Milestone',
        type: 'Trip',
        value: 500000,
        criteria: JSON.stringify({ milestone: 'Diamond', teamCount: 500 }),
        isActive: true,
      },
    ],
  });
  console.log('✅ Default Milestone Awards created');

  console.log('🌱 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
