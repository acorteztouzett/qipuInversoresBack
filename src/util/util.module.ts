import { Module } from '@nestjs/common';
import { UtilService } from './util.service';
import { UtilController } from './util.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banks } from '../auth/entities/banks.entity';
import { Risk } from '../auth/entities/risk.entity';
import { WebConfig } from '../auth/entities/webconfig.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  controllers: [UtilController],
  providers: [UtilService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Banks, Risk, WebConfig, User])
  ],
  exports: [TypeOrmModule]
})
export class UtilModule {}
