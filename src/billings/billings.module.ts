import { Module } from '@nestjs/common';
import { BillingsService } from './billings.service';
import { BillingsController } from './billings.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Payer } from '../auth/entities/payer.entity';
import { Billing } from '../auth/entities/billing.entity';
import { Operation } from '../auth/entities/operation.entity';
import { Operator } from '../auth/entities/operator.entity';

@Module({
  controllers: [BillingsController],
  providers: [BillingsService],
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([User,Payer,Billing,Operation,Operator])
  ],
  exports: [TypeOrmModule]
})
export class BillingsModule {}
