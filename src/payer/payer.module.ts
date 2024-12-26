import { Module } from '@nestjs/common';
import { PayerService } from './payer.service';
import { PayerController } from './payer.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Payer } from '../auth/entities/payer.entity';
import { Operator } from '../auth/entities/operator.entity';

@Module({
  controllers: [PayerController],
  providers: [PayerService],
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([User,Payer,Operator])
  ],
  exports:[TypeOrmModule]
})
export class PayerModule {}
