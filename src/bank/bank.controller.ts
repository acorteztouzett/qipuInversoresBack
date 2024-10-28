import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Headers, Head } from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post('create-account')
  create(@Headers('token') token, @Body() createBankDto: CreateBankDto) {
    return this.bankService.create(token,createBankDto);
  }

  @Get('find-accounts')
  findAll(@Headers('token') token) {
    return this.bankService.findAll(token);
  }

  @Put('edit-account')
  update(@Headers('token') token, @Headers('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    return this.bankService.update(token, id, updateBankDto);
  }

  @Delete('delete-account')
  remove(@Headers('token') token, @Headers('id') id: string) {
    return this.bankService.remove(token, id);
  }
}
