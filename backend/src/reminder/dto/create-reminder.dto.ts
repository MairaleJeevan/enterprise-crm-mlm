import { IsString, IsNotEmpty, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReminderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsDateString()
  remindAt: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}
