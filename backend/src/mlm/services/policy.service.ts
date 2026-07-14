import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PolicyService {
  constructor(private prisma: PrismaService) {}

  async assignPolicy(adminId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.kycStatus !== 'VERIFIED') {
      throw new BadRequestException('User KYC must be verified before policy assignment');
    }

    // Auto-generate policy number: POL-YYYY-XXXXX
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const policyNumber = `POL-${year}-${rand}`;

    const policy = await this.prisma.policy.create({
      data: {
        policyNumber,
        userId: data.userId,
        policyType: data.policyType, // Life, Health, Term, Endowment
        coverageAmount: parseFloat(data.coverageAmount),
        premiumAmount: parseFloat(data.premiumAmount),
        premiumFrequency: data.premiumFrequency, // Monthly, Quarterly, Yearly
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'ACTIVE',
        policyHolderName: `${user.firstName} ${user.lastName || ''}`.trim(),
        policyHolderDob: data.policyHolderDob ? new Date(data.policyHolderDob) : null,
        policyHolderAddress: data.policyHolderAddress || null,
        policyNomineeName: data.policyNomineeName || null,
        policyNomineeRelationship: data.policyNomineeRelationship || null,
        assignedBy: adminId,
        assignedAt: new Date(),
        policyDocument: data.policyDocument || 'base64_mock_pdf_stream',
        policySummary: JSON.stringify({
          notes: 'Standard advisor policy package assigned post-onboarding welcome call.',
        }),
      },
    });

    // Link the policy to the User account is handled by the userId relationship in the Policy table.
    // No direct policyId column needed on User.

    // Create Notification for the user
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: 'New Policy Assigned 📜',
        message: `Your insurance policy ${policyNumber} has been issued and is visible on your portal.`,
        type: 'KYC',
      },
    });

    return policy;
  }

  async getMyPolicies(userId: string) {
    const policies = await this.prisma.policy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Generate dynamic chart data coordinates for Recharts (premium payments over time, coverage growth)
    return policies.map((p) => {
      const chartData = this.generatePolicyChartData(p);
      return {
        ...p,
        chartData,
      };
    });
  }

  async getAllPolicies() {
    return this.prisma.policy.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generatePolicyChartData(policy: any) {
    const points = [];
    const basePremium = policy.premiumAmount;
    const baseCoverage = policy.coverageAmount;
    
    // Simulate last 6 payments/increments
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      const factor = 6 - i;
      points.push({
        month: months[mIdx],
        premiumPaid: basePremium * factor,
        coverageGrowth: baseCoverage + (baseCoverage * 0.02 * factor), // 2% growth per payment cycle
      });
    }

    return points;
  }
}
