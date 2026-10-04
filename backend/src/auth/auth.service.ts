import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MlmRankService } from '../mlm/mlm-rank.service';
import { buildReferralLinks } from '../mlm/referral-links';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mlmRankService: MlmRankService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Auto-generate referral code for MLM_DISTRIBUTOR
    let referralCode: string | null = null;
    if (dto.role === 'MLM_DISTRIBUTOR') {
      const year = new Date().getFullYear();
      const rand = Math.floor(10000 + Math.random() * 90000);
      referralCode = `REF-${year}-${rand}`;
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
          referralCode,
          kycStatus: dto.role === 'MLM_DISTRIBUTOR' ? 'PENDING' : 'VERIFIED',
        },
      });

      // Initialize Referral Dashboard record
      if (dto.role === 'MLM_DISTRIBUTOR' && referralCode) {
        const { qrCode } = buildReferralLinks(referralCode);

        await tx.referral.create({
          data: {
            userId: user.id,
            referralCode,
            qrCode,
            totalReferrals: 0,
            successfulReferrals: 0,
            referralEarnings: 0,
          },
        });
      }

      // 2. Link to Franchise if STORE_USER
      if (dto.role === 'STORE_USER') {
        if (!dto.franchiseId) {
          throw new ConflictException('Franchise ID is required for store users');
        }
        const franchise = await tx.franchise.findUnique({
          where: { id: dto.franchiseId },
        });
        if (!franchise) {
          throw new NotFoundException('Franchise not found');
        }
        await tx.storeUser.create({
          data: {
            userId: user.id,
            franchiseId: dto.franchiseId,
            role: dto.storeRole || 'CASHIER',
          },
        });
      }

      // 3. Create MLM node if MLM_DISTRIBUTOR
      if (dto.role === 'MLM_DISTRIBUTOR') {
        let parentNodeId: string | null = null;
        
        if (dto.sponsorId) {
          const sponsor = await tx.user.findUnique({
            where: { id: dto.sponsorId },
            include: { mlmNode: true },
          });
          if (!sponsor || !sponsor.mlmNode) {
            throw new NotFoundException('Sponsor not found in MLM network');
          }
          parentNodeId = sponsor.mlmNode.id;
        }

        // Determine placement for binary tree (optional)
        let placementNodeId = parentNodeId;
        let position = dto.position || 'LEFT';

        if (parentNodeId && dto.position) {
          // Verify if position is already occupied
          const occupied = await tx.mlmNode.findFirst({
            where: {
              placementId: parentNodeId,
              position: dto.position,
            },
          });
          if (occupied) {
            throw new ConflictException(`Position ${dto.position} under this upline is already occupied`);
          }
        }

        await tx.mlmNode.create({
          data: {
            userId: user.id,
            parentId: parentNodeId,
            placementId: placementNodeId,
            position: parentNodeId ? position : null,
          },
        });

        // Track the referral signup log under the sponsor
        if (dto.sponsorId) {
          const sponsorReferral = await tx.referral.findUnique({
            where: { userId: dto.sponsorId },
          });
          if (sponsorReferral) {
            await tx.referralHistory.create({
              data: {
                referralId: sponsorReferral.id,
                referredMemberId: user.id,
                status: 'PENDING',
                commissionAmount: 0.0,
              },
            });
            await tx.referral.update({
              where: { id: sponsorReferral.id },
              data: {
                totalReferrals: { increment: 1 },
              },
            });
          }
        }

        if (parentNodeId) {
          await this.mlmRankService.checkAndUpgradeRank(tx, parentNodeId);
        }
      }

      const { password, ...result } = user;
      return result;
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        storeUsers: true,
        mlmNode: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        storeUsers: user.storeUsers,
        mlmNode: user.mlmNode,
      },
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        storeUsers: {
          include: {
            franchise: true,
          },
        },
        mlmNode: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: string, dto: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Handle franchise update for STORE_USER
      if (updatedUser.role === 'STORE_USER' && dto.franchiseId) {
        const storeUserExists = await tx.storeUser.findFirst({
          where: { userId: id },
        });

        if (storeUserExists) {
          await tx.storeUser.update({
            where: { id: storeUserExists.id },
            data: {
              franchiseId: dto.franchiseId,
              role: dto.storeRole || 'CASHIER',
            },
          });
        } else {
          await tx.storeUser.create({
            data: {
              userId: id,
              franchiseId: dto.franchiseId,
              role: dto.storeRole || 'CASHIER',
            },
          });
        }
      }

      const { password, ...result } = updatedUser;
      return result;
    });
  }


}
