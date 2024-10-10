import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Req, Put } from '@nestjs/common';
import { PayerService } from './payer.service';
import { Request, Response } from 'express';


@Controller('contact')
export class PayerController {
  constructor(private readonly payerService: PayerService) {}

  @Post('listcontact-user')
  async listContactUser(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.listarContactosporUser(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('create')
  async createContact(@Req() req: Request,@Res() res: Response) {
     try {
       const response = await this.payerService.createContact( req, res);
       return res.status(200).json(response);
     } catch (error) {
       return res.status(400).json({ msg: error.message });
     }
  }

  @Get('listcontacts-operator')
  async listContactsOperator(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.listarContactosUserOperator(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('listcontacts-admin')
  async listContactsAdmin(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.listarContactosUserAdmin(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('list-id')
  async listById(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.listarContacto(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('listnames')
  async listNames(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.listarContactosName(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('list')
  async list(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.listContacts(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Put('edit')
  async update(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.modificarContacto(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Delete('delete')
  async delete(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.payerService.eliminarContacto(req,res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }
}
