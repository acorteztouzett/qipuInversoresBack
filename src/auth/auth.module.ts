import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Investor } from './entities/investor.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { InvestorRepresentation } from './entities/investor_representation.entity';
import { Investment } from './entities/investments.entity';
import { MyInvestment } from './entities/my_investments.entity';
import { BankAccount } from './entities/bank_account.entity';
import { Banks } from './entities/banks.entity';
import { Billing } from './entities/billing.entity';
import { Company } from './entities/company.entity';
import { Operation } from './entities/operation.entity';
import { Operator } from './entities/operator.entity';
import { Payer } from './entities/payer.entity';
import { Risk } from './entities/risk.entity';
import { Wallet } from './entities/wallet.entity';
import { User } from './entities/user.entity';
import { Documentation } from './entities/documentation.entity';

@Module({
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
  imports:[
    ConfigModule,
    TypeOrmModule.forFeature([
      Investor, InvestorRepresentation, Investment, MyInvestment,BankAccount,Banks,Billing,Company,Operation,Operator,Payer,Risk,Wallet,User,Documentation
    ]),
    PassportModule.register({defaultStrategy:'jwt'}),
    JwtModule.registerAsync({
      useFactory:()=>{
          return{
            secret:process.env.JWT_SECRET,
            signOptions:{
            expiresIn:'10d'
           }
          }
      },
    })
  ],
  exports: [TypeOrmModule,JwtStrategy,PassportModule,JwtModule]
})
export class AuthModule {}
