import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Headers, Head, UseInterceptors, Res, Req } from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { SearchTransactionDto } from './dto/search-transaction.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { SearchBankAccountDto } from './dto/search-bank-account.dto';

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

  @Post('find-transactions')
  findTransactions(@Headers('token') token, @Body() searchTransactionDto:SearchTransactionDto) {
    return this.bankService.findTransactions(token,searchTransactionDto);
  }

  @Get('find-wallets')
  findWallets(@Headers('token') token) {
    return this.bankService.findWallets(token);
  }

  @Get('transaction')
  findOneTransaction(@Headers('token') token, @Headers('id') id: string) {
    return this.bankService.findOneTransaction(token, id);
  }

  @Post('deposit')
  @UseInterceptors(AnyFilesInterceptor())
  deposit(@Req() req:Request, @Res() res: Response) {
    return this.bankService.deposit(req,res);
  }

  @Post('withdraw')
  @UseInterceptors(AnyFilesInterceptor())
  withdraw(@Req() req:Request, @Res() res: Response) {
    return this.bankService.withdraw(req,res);
  }

  //ADMIN

  @Post('find-transactions-admin')
  findTransactionsAdmin(@Headers('token') token, @Body() searchTransactionDto:SearchTransactionDto) {
    return this.bankService.findTransactionsAdmin(token, searchTransactionDto);
  }

  @Put('manage-deposit')
  manageDeposit(@Headers('token') token, @Headers('id') id: string, @Body() body) {
    return this.bankService.manageDeposit(token, id, body.status);
  }

  @Put('manage-withdraw')
  @UseInterceptors(AnyFilesInterceptor())
  manageWithdraw(@Req() req:Request, @Res() res: Response) {
    return this.bankService.manageWithdraw(req,res);
  }

  @Post('find-accounts-admin')
  findAccountsAdmin(@Headers('token') token, @Body() searchBankAccountDto:SearchBankAccountDto) {
    return this.bankService.findAccountsAdmin(token, searchBankAccountDto);
  }

  @Put('manage-account')
  manageAccount(@Headers('token') token, @Headers('id') id: string, @Body() body) {
    return this.bankService.manageAccount(token, id, body.status);
  }
}
