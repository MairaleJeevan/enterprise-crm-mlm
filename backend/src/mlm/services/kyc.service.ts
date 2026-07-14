import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submitKyc(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upsert KYC details
    const kyc = await this.prisma.memberKYC.upsert({
      where: { userId },
      update: {
        aadharNumber: data.aadharNumber,
        aadharFrontFile: data.aadharFrontFile,
        aadharBackFile: data.aadharBackFile,
        aadharVerified: false,
        panNumber: data.panNumber,
        panFile: data.panFile,
        panVerified: false,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        branchName: data.branchName,
        accountHolder: data.accountHolder,
        bankVerified: false,
        ref1Name: data.ref1Name,
        ref1Phone: data.ref1Phone,
        ref1Relationship: data.ref1Relationship,
        ref2Name: data.ref2Name,
        ref2Phone: data.ref2Phone,
        ref2Relationship: data.ref2Relationship,
        nomineeName: data.nomineeName,
        nomineeRelationship: data.nomineeRelationship,
        nomineeAge: data.nomineeAge ? parseInt(data.nomineeAge, 10) : null,
        nomineePhone: data.nomineePhone,
        nomineeAddress: data.nomineeAddress,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        rejectionReason: null,
      },
      create: {
        userId,
        aadharNumber: data.aadharNumber,
        aadharFrontFile: data.aadharFrontFile,
        aadharBackFile: data.aadharBackFile,
        panNumber: data.panNumber,
        panFile: data.panFile,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        branchName: data.branchName,
        accountHolder: data.accountHolder,
        ref1Name: data.ref1Name,
        ref1Phone: data.ref1Phone,
        ref1Relationship: data.ref1Relationship,
        ref2Name: data.ref2Name,
        ref2Phone: data.ref2Phone,
        ref2Relationship: data.ref2Relationship,
        nomineeName: data.nomineeName,
        nomineeRelationship: data.nomineeRelationship,
        nomineeAge: data.nomineeAge ? parseInt(data.nomineeAge, 10) : null,
        nomineePhone: data.nomineePhone,
        nomineeAddress: data.nomineeAddress,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Update main user status
    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'SUBMITTED' },
    });

    // Add Notification
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'KYC Documents Submitted',
        message: 'Your documents have been received and are undergoing verification (24-hour SLA).',
        type: 'KYC',
      },
    });

    return kyc;
  }

  async getKycStatus(userId: string) {
    const kyc = await this.prisma.memberKYC.findUnique({
      where: { userId },
    });
    if (!kyc) {
      return { status: 'PENDING' };
    }
    return kyc;
  }

  async getPendingKycs() {
    return this.prisma.memberKYC.findMany({
      where: {
        status: 'SUBMITTED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async verifyKyc(kycId: string, adminId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) {
    const kyc = await this.prisma.memberKYC.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    if (action === 'APPROVE') {
      const updatedKyc = await this.prisma.memberKYC.update({
        where: { id: kycId },
        data: {
          status: 'VERIFIED',
          aadharVerified: true,
          panVerified: true,
          bankVerified: true,
          verifiedAt: new Date(),
          verifiedBy: adminId,
        },
      });

      await this.prisma.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: 'VERIFIED' },
      });

      // Schedule Welcome Call (SLA within 24 hours)
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 24);

      await this.prisma.welcomeCallSchedule.create({
        data: {
          userId: kyc.userId,
          scheduledDate,
          status: 'PENDING',
          notes: 'Automatic schedule after KYC verification',
        },
      });

      // Send User Notification
      await this.prisma.notification.create({
        data: {
          userId: kyc.userId,
          title: 'KYC Approved! 🎉',
          message: 'Your documents have been verified. A welcome call has been scheduled.',
          type: 'KYC',
        },
      });

      return updatedKyc;
    } else {
      if (!rejectionReason) {
        throw new BadRequestException('Rejection reason must be provided');
      }

      const updatedKyc = await this.prisma.memberKYC.update({
        where: { id: kycId },
        data: {
          status: 'REJECTED',
          rejectionReason,
          verifiedAt: new Date(),
          verifiedBy: adminId,
        },
      });

      await this.prisma.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: 'REJECTED' },
      });

      // Send User Notification
      await this.prisma.notification.create({
        data: {
          userId: kyc.userId,
          title: 'KYC Documents Rejected',
          message: `Your KYC documents were rejected. Reason: ${rejectionReason}. Please correct and resubmit.`,
          type: 'KYC',
        },
      });

      return updatedKyc;
    }
  }
}
