import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, Put, UseInterceptors, UploadedFile, UploadedFiles, Headers } from '@nestjs/common';
import { BillingsService } from './billings.service';
import { Request, Response } from 'express';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { SearchOperationsDto } from './dto/search-operations.dto';
import { EditOperationDto } from './dto/edit-operations.dto';

@Controller('billing')
export class BillingsController {
  constructor(private readonly billingsService: BillingsService) {}

  @Get('list-operator')
  async listOperator(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.getInfoOperator(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('list-admin')
  async listAdmin(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.getInfoAdmin(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('list')
  async list(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.getInfo(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('list-operations')
  async listOperations(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.getOperation(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('info-user')
  async infoUser(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.getInfoUserAdmin(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('create')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Req() req: Request,@Res() res: Response, 
  ) {
    try {  
      const response = await this.billingsService.createBill(req, res);
      return res.status(200).json(response);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('create-bulk')
  @UseInterceptors(AnyFilesInterceptor())
  async createBulk(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.createBulk(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Put('edit')
  @UseInterceptors(AnyFilesInterceptor())
  async edit(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.editBill(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Put('edit-operation')
  @UseInterceptors(AnyFilesInterceptor())
  async editOperation(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.editOperation(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Put('operation')
  @UseInterceptors(AnyFilesInterceptor())
  async operation(@Req() req: Request,@Res() res: Response) {
    try {
      const response = await this.billingsService.operationBill(req, res);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('list-operations-admin')
  listOperationsAdmin(@Headers('token') token, @Body() searchOperationsDto:SearchOperationsDto) {
    return this.billingsService.getOperationAdmin(token,searchOperationsDto);
  }

  @Put('manage-operation-admin')
  editOperationAdmin(@Headers('token') token,@Headers('id') id, @Body() editOperationDto:EditOperationDto) {
    return this.billingsService.editOperationAdmin(token, id, editOperationDto);
  }
}
