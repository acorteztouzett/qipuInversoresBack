import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Req, Res, UploadedFile, UseInterceptors, Headers, Put } from '@nestjs/common';
import { Request, Response } from 'express';
import { AwsService } from './aws.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { SearchDocDto } from './dto/search-doc.dto';


@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Get('listfiles')
  async listFiles(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.headers['token'] as string;
      const links = await this.awsService.listFiles(token);

      return res.status(200).json(links);
    } catch (error) {
      if (error.status === 401) {
        return res.status(401).json({ msg: 'User not found' });
      }
      return res.status(400).json({ msg: error.message });
    }
  }


  @Post('upload/:type')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string
  ) {
    try {
      const allowedTypes= ['ruc','dni','rtt','repre','info','otros'];
      if(!allowedTypes.includes(type)){
        return res.status(400).json({ msg: 'Invalid type' });
      }
      const token = req.headers.token as string;
      const response = await this.awsService.uploadFile(token, file, type);

      return res.status(200).json(response);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ msg: error.message });
    }
  }

  @Post('upload-doc')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadDoc(@Req() req:Request, @Res() res: Response) {
    try {
      const response = await this.awsService.uploadDoc(req, res);
      return response;
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  @Get('list-docs')
  async listDocs(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.headers['token'] as string;
      const docs = await this.awsService.listDocs(token);

      return res.status(200).json(docs);
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }

  //ADMIN
  @Get('list-docs-admin')
  async listDocsAdmin(@Headers('token') token, @Body() searchDocDto:SearchDocDto) {
    return this.awsService.listDocsAdmin(token, searchDocDto);
  }

  @Put('manage-docs')
  async manageDocs(@Headers('token') token, @Headers('id') id:string, @Body() body) {
    return this.awsService.manageDocs(token, id, body.status);
  }

}
