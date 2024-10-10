import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, Res, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, response, Response } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('edit')
  @UseInterceptors(AnyFilesInterceptor())
  async edit(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.editUser(req,res);
      return res.status(200).json(response);
    } catch (error) {
      res.status(400).json({ msg: error});
    }
  }

  @Post('listusers')
  async listUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.mostrarUsers(req,res);
      res.status(200).json(response);
    } catch (error) {
      res.status(400).json({ msg: error});  
    }
  }

  @Post('getuser')
  async getUser(@Req() req: Request, @Res() res: Response) {
    return this.userService.mostrarUser(req,res);
  }

  @Get('getoperator')
  async getOperator(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.mostrarUsersOperador(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('nametoken')
  async nameToken(@Req() req: Request, @Res() res: Response) {
    return this.userService.mostrarUsersNameToken(req,res);
  }

  @Get('nametoken-operator')
  async nameTokenOperator(@Req() req: Request, @Res() res: Response) {
    return this.userService.mostrarUsersNameTokenOperador(req,res);
  }

  @Get('listoperators')
  async listOperadores(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.mostrarOperadores(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    return this.userService.loginUser(req,res);
  }

  @Post('sign-in-admin')
  @UseInterceptors(AnyFilesInterceptor())
  async signInAdmin(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.crearUserAdmin(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Put('asign-users')
  async asignUsers(@Req() req: Request, @Res() res: Response) {
    return this.userService.asignarOperador(req,res);
  }

  @Put('edit-operator')
  @UseInterceptors(AnyFilesInterceptor())
  async editOperator(@Req() req: Request, @Res() res: Response) {
    try {
      const response=await this.userService.editOperator(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Put('deleteoperator')
  @UseInterceptors(AnyFilesInterceptor())
  async deleteOperator(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.deleteOperator(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Put('deleteuser')
  @UseInterceptors(AnyFilesInterceptor())
  async deleteUser(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.deleteUser(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('sign-in')
  async signIn(@Req() req: Request, @Res() res: Response) {
    return this.userService.crearUser(req,res);
  }

  @Post('sign-in-operator')
  async signInOperator(@Req() req: Request, @Res() res: Response) {
    try {
      const response=await this.userService.crearUserOperator(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Req() req: Request, @Res() res: Response) {
    return this.userService.forgotPassword(req,res);
  }

  @Post('reset-password')
  async resetPassword(@Req() req: Request, @Res() res: Response) {
    return this.userService.resetPassword(req,res);
  }

  @Post('emailsender')
  @UseInterceptors(AnyFilesInterceptor())
  async emailSender(@Req() req: Request, @Res() res: Response) {
    return this.userService.emailUser(req,res);
  }

  @Put('editpass')
  async editPass(@Req() req: Request, @Res() res: Response) {
    return this.userService.editPassword(req,res);
  }

  @Delete('deleteuser')
  @UseInterceptors(AnyFilesInterceptor())
  async deleteUserAdmin(@Req() req: Request, @Res() res: Response) {
    try {
      const response= await this.userService.deleteUser(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }
}
