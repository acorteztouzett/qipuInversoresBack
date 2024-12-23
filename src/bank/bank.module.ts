import { Module } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Investor } from '../auth/entities/investor.entity';
import { BankAccount } from '../auth/entities/bank_account.entity';
import { Wallet } from '../auth/entities/wallet.entity';
import { Transaction } from '../auth/entities/transaction.entity';
import { Operation } from '../auth/entities/operation.entity';

@Module({
  controllers: [BankController],
  providers: [BankService],
  imports: [
    AuthModule,
    ConfigModule,
    TypeOrmModule.forFeature([Investor,BankAccount,Wallet,Transaction,Operation])
  ],
  exports: [TypeOrmModule]
})
export class BankModule {}
