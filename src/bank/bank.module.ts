import { Module } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Investor } from '../auth/entities/investor.entity';
import { BankAccount } from '../auth/entities/bank_account.entity';

@Module({
  controllers: [BankController],
  providers: [BankService],
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([Investor,BankAccount])
  ]
})
export class BankModule {}
