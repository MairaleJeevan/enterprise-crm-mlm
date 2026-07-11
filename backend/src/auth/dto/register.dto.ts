import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsEnum(['ADMIN', 'STORE_USER', 'MLM_DISTRIBUTOR'])
  role: string;

  // For store users
  @IsString()
  @IsOptional()
  franchiseId?: string;

  @IsString()
  @IsOptional()
  storeRole?: string; // MANAGER, CASHIER

  // For MLM members
  @IsString()
  @IsOptional()
  sponsorId?: string; // Direct recruiter user ID

  @IsString()
  @IsOptional()
  position?: string; // LEFT or RIGHT
}
