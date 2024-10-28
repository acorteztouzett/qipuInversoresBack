import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpException, HttpStatus, Res, Req, UseInterceptors, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, RegisterDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateInvestorRepresentationDto } from './dto/create-investor_representation.dto';
import { GetUser } from './decorators/get-user.decorator';
import { Auth } from './decorators/auth.decorator';
import { ValidRoles } from './interfaces/valid-roles';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { readFile } from 'fs/promises';
import { Request, Response } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { EditInvestorRepresentationDto } from './dto/edit-investor_representation.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() registerDto: RegisterDto) {
    return this.authService.create(registerDto.investor, registerDto.investorRep, registerDto.company);
  }

  @Post('login')
  findAll(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('account-info')
  findAccout(@Headers('token') token) {
    return this.authService.getAccount(token);
  }

  @Put('edit-account')
  editAccount(@Headers('token') token, @Body() UpdateAuthDto:UpdateAuthDto) {
    return this.authService.editAccount(token, UpdateAuthDto.investor, UpdateAuthDto.company);
  }

  @Post('add-investor-rep')
  addInvestorRep(@Headers('token') token, @Body() createInvestorRepresentationDto:CreateInvestorRepresentationDto){
    return this.authService.addInvestorRep(token, createInvestorRepresentationDto);
  }

  @Put('edit-investor-rep')
  editInvestorRep(@Headers('token') token, @Body() editInvestorRepresentationDto:EditInvestorRepresentationDto){
    return this.authService.editInvestorRep(token, editInvestorRepresentationDto);
  }

  @Delete('delete-investor-rep')
  deleteInvestorRep(@Headers('token') token, @Body() {representation_id}){
    return this.authService.deleteInvestorRep(token, representation_id);
  }

  // SERVICIO PRINCIPAL
  @Post('/ruc_verify')
  @UseInterceptors(AnyFilesInterceptor())
  async verifyRuc(@Req() req:Request, @Res() res: Response) {
    const ruc= req.body.ruc;
    if (!ruc) {
      throw new HttpException('RUC is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const data = await readFile('ruc.json', 'utf8');
      const rucs = JSON.parse(data);

      const validatedRuc = rucs.some(i => i.RUC === parseInt(ruc));

      if (!validatedRuc) {
        return res.status(401).json({ validate: false });
      }

      return res.status(200).json({ validate: true });
    } catch (error) {
      console.log(error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('email')
  async checkEmail(@Req() req: Request, @Res() res: Response) {
    return this.authService.checkEmail(req, res);
  }

  @Post('token')
  async resetToken(@Req() req: Request, @Res() res: Response) {
    return this.authService.resetToken(req, res);
  }

  @Post('ruc')
  async checkRuc(@Req() req: Request, @Res() res: Response) {

    return this.authService.checkRuc(req, res);
  }
}
