import { Module } from '@nestjs/common';
import { PayerService } from './payer.service';
import { PayerController } from './payer.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Payer } from '../auth/entities/payer.entity';

@Module({
  controllers: [PayerController],
  providers: [PayerService],
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([User,Payer])
  ],
  exports:[TypeOrmModule]
})
export class PayerModule {}
