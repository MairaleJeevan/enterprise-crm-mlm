import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
        },
      });

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

        if (parentNodeId) {
          await this.checkAndUpgradeRank(tx, parentNodeId);
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

  private async checkAndUpgradeRank(tx: any, nodeId: string) {
    const node = await tx.mlmNode.findUnique({
      where: { id: nodeId },
      include: {
        children: true,
      },
    });
    if (!node) return;

    const directSponsorCount = node.children.length;
    const orgCount = await this.getOrganizationCount(tx, nodeId);
    const teamLeadersCount = node.children.filter(
      (c) => c.rank === 'Team Leader (TL)' || c.rank === 'Team Manager' || c.rank === 'Founder Member'
    ).length;

    let newRank = 'Sales Advisor';

    if (orgCount >= 27000) {
      newRank = 'Founder Member';
    } else if (teamLeadersCount >= 30) {
      newRank = 'Team Manager';
    } else if (directSponsorCount >= 30) {
      newRank = 'Team Leader (TL)';
    }

    if (newRank !== node.rank) {
      await tx.mlmNode.update({
        where: { id: nodeId },
        data: { rank: newRank },
      });
    }

    if (node.parentId) {
      await this.checkAndUpgradeRank(tx, node.parentId);
    }
  }

  private async getOrganizationCount(tx: any, nodeId: string): Promise<number> {
    let count = 0;
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await tx.mlmNode.findMany({
        where: { parentId: currentId },
        select: { id: true },
      });
      count += children.length;
      queue.push(...children.map((c) => c.id));
    }
    return count;
  }
}
