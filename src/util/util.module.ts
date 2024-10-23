import { Module } from '@nestjs/common';
import { UtilService } from './util.service';
import { UtilController } from './util.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [UtilController],
  providers: [UtilService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([])
  ],
  exports: [TypeOrmModule]
})
export class UtilModule {}
