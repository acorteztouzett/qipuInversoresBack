import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { AwsController } from './aws.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Investor } from '../auth/entities/investor.entity';
import { Documentation } from '../auth/entities/documentation.entity';

@Module({
  controllers: [AwsController],
  providers: [AwsService],
  imports:  [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([User,Investor,Documentation])
  ],
  exports:[TypeOrmModule]
})
export class AwsModule {}
