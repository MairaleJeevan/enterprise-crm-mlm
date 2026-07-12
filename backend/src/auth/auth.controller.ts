import { Controller, Post, Body, Get, UseGuards, Req, Param, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('users')
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: any) {
    return this.authService.updateUser(id, dto);
  }
}
