import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
}
