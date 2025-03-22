import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module';
import { AwsModule } from './aws/aws.module';
import { PayerModule } from './payer/payer.module';
import { BillingsModule } from './billings/billings.module';
import { UserModule } from './user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { UtilModule } from './util/util.module';
import { BankModule } from './bank/bank.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RequestLoggerMiddleware } from './util/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      username: process.env.DB_USER,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),
    MailerModule.forRoot({
      transport:{
        host: process.env.MAIL_HOST,
        port: +process.env.MAIL_PORT,
        secure:false,
        auth:{
          user:process.env.MAIL_USER,
          pass:process.env.MAIL_PASS,
        },
        tls:{
          rejectUnauthorized:false,
        }
      },    
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // milliseconds
      limit: 30, // requests
    }]),
    AuthModule,
    AwsModule,
    PayerModule,
    BillingsModule,
    UserModule,
    UtilModule,
    BankModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ]
})
export class AppModule {
  configure(cosumer: MiddlewareConsumer) {
    cosumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
