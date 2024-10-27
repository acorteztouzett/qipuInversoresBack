import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Headers } from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post('create')
  create(@Headers('token') token, @Body() createBankDto: CreateBankDto) {
    return this.bankService.create(token,createBankDto);
  }

  @Get('findall')
  findAll(@Headers('token') token) {
    return this.bankService.findAll(token);
  }

  @Put(':id')
  update(@Headers('token') token, @Param('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    return this.bankService.update(token,+id, updateBankDto);
  }

  @Delete(':id')
  remove(@Headers('token') token, @Param('id') id: string) {
    return this.bankService.remove(token, +id);
  }
}
