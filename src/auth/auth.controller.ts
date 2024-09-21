import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, RegisterDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateInvestorRepresentationDto } from './dto/create-investor_representation.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() registerDto: RegisterDto) {
    return this.authService.create(registerDto.investor, registerDto.investorRep);
  }

  @Get('login')
  findAll(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

}
