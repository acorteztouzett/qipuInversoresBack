import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Operator } from '../auth/entities/operator.entity';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([User, Operator])
  ],
  exports: [TypeOrmModule]
})
export class UserModule {}
