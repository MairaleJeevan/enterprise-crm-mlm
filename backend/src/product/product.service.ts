import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // --- CATEGORIES ---
  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Category name already exists');
    }
    return this.prisma.category.create({ data: dto });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  // --- PRODUCTS ---
  async createProduct(dto: CreateProductDto) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingProduct) {
      throw new ConflictException('Product SKU already exists');
    }

    const franchise = await this.prisma.franchise.findUnique({
      where: { id: dto.franchiseId },
    });
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const {
      initialQuantity = 0,
      reorderLevel = 0,
      maxLevel,
      inventoryLocation,
      ...productData
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productData,
      });

      await tx.inventory.create({
        data: {
          productId: product.id,
          franchiseId: dto.franchiseId,
          quantity: initialQuantity,
          reorderLevel,
          maxLevel,
          location: inventoryLocation,
        },
      });

      return tx.product.findUnique({
        where: { id: product.id },
        include: { inventory: true },
      });
    });
  }

  async findAllProducts(franchiseId?: string, categoryId?: string, search?: string) {
    const where: any = {};
    if (franchiseId) where.franchiseId = franchiseId;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        franchise: { select: { name: true, code: true } },
        inventory: true,
      },
    });
  }

  async findOneProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        franchise: true,
        inventory: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async updateProduct(id: string, dto: Partial<CreateProductDto>) {
    const product = await this.findOneProduct(id);
    
    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException('Product SKU already exists');
      }
    }

    const {
      initialQuantity,
      reorderLevel,
      maxLevel,
      inventoryLocation,
      ...productData
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData,
      });

      if (reorderLevel !== undefined || maxLevel !== undefined || inventoryLocation !== undefined) {
        await tx.inventory.update({
          where: { productId: id },
          data: {
            reorderLevel,
            maxLevel,
            location: inventoryLocation,
          },
        });
      }

      return tx.product.findUnique({
        where: { id },
        include: { inventory: true },
      });
    });
  }

  async updateStock(productId: string, quantityChange: number) {
    const product = await this.findOneProduct(productId);
    if (!product.inventory) {
      throw new NotFoundException('Inventory record not found for this product');
    }

    const newQuantity = Math.max(0, product.inventory.quantity + quantityChange);

    return this.prisma.inventory.update({
      where: { productId },
      data: {
        quantity: newQuantity,
        lastUpdated: new Date(),
      },
    });
  }

  async getLowStockAlerts(franchiseId?: string) {
    const where: any = {};
    if (franchiseId) where.franchiseId = franchiseId;

    // Direct filter using Prisma schema query
    const products = await this.prisma.product.findMany({
      where: {
        ...where,
        inventory: {
          quantity: {
            lte: this.prisma.inventory.fields.reorderLevel
          }
        }
      },
      include: {
        inventory: true,
        franchise: { select: { name: true, code: true } }
      }
    });

    return products;
  }

  async removeProduct(id: string) {
    await this.findOneProduct(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.inventory.delete({ where: { productId: id } });
      return tx.product.delete({ where: { id } });
    });
  }
}
