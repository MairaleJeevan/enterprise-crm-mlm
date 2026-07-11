import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  franchiseId: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @IsNumber()
  @Min(0)
  taxRate: number; // e.g. 0.18 for 18%

  @IsString()
  @IsOptional()
  unit?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Inventory fields
  @IsInt()
  @Min(0)
  @IsOptional()
  initialQuantity?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxLevel?: number;

  @IsString()
  @IsOptional()
  inventoryLocation?: string;
}
