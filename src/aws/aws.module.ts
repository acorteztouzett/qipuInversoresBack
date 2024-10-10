import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { AwsController } from './aws.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';

@Module({
  controllers: [AwsController],
  providers: [AwsService],
  imports:  [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([User])
  ],
  exports:[TypeOrmModule]
})
export class AwsModule {}
