import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Header, Headers } from '@nestjs/common';
import { UtilService } from './util.service';

@Controller('util')
export class UtilController {
  constructor(private readonly utilService: UtilService) {}

  @Get('departments')
  async getDepartments() {
    return await this.utilService.getDepartments();
  }

  @Get('provinces/:id')
  async getProvinces(@Param('id') id: string) {
    return await this.utilService.getProvinces(id);
  }

  @Get('districts/:id')
  async getDistricts(@Param('id') id: string) {
    return await this.utilService.getDistricts(id);
  }

  @Get('list-banks')
  async getBanks() {
    return await this.utilService.getBanks();
  }

  @Get('list-risk')
  async getRisk() {
    return await this.utilService.getRisk();
  }

  @Get('web-config')
  async getWebConfig() {
    return await this.utilService.getWebConfig();
  }

  @Put('web-config')
  async updateWebConfig(@Body() body, @Headers('token') token: string) {
    return await this.utilService.updateWebConfig(token, body.value);
  }
}
