import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file'; 


dayjs.extend(customParseFormat);

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger: WinstonModule.createLogger({
      transports: [
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: format.combine( format.timestamp(), format.json() )
        }),
        new transports.File({
          filename: 'logs/general.log',
          level: 'info',
          format: format.combine( format.timestamp(), format.json() )
        }),
        new transports.Console({
          format: format.combine( format.colorize(), format.simple() )
        }),
        new transports.DailyRotateFile({
          filename: 'logs/%DATE%-error.log',
          level: 'error',
          format: format.combine( format.timestamp(), format.json() ),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxFiles: '30d'
        }),
        new transports.DailyRotateFile({
          filename: 'logs/%DATE%-general.log',
          level: 'info',
          format: format.combine( format.timestamp(), format.json() ),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxFiles: '30d'
        })
      ]
    })
  });

  app.enableCors();
  app.use( helmet() );

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Qipu Backend')
    .setVersion('2.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 8080);
}

bootstrap();
