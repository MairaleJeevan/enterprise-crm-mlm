import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // --- CATEGORIES ---
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productService.createCategory(dto);
  }

  @Get('categories')
  findAllCategories() {
    return this.productService.findAllCategories();
  }

  // --- PRODUCTS ---
  @Post()
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Get()
  findAllProducts(
    @Query('franchiseId') franchiseId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.productService.findAllProducts(franchiseId, categoryId, search);
  }

  @Get('low-stock')
  getLowStockAlerts(@Query('franchiseId') franchiseId?: string) {
    return this.productService.getLowStockAlerts(franchiseId);
  }

  @Get(':id')
  findOneProduct(@Param('id') id: string) {
    return this.productService.findOneProduct(id);
  }

  @Patch(':id')
  updateProduct(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.productService.updateProduct(id, dto);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body('quantityChange') quantityChange: number) {
    return this.productService.updateStock(id, quantityChange);
  }

  @Delete(':id')
  removeProduct(@Param('id') id: string) {
    return this.productService.removeProduct(id);
  }
}
