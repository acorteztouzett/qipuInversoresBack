import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import helmet from 'helmet';

dayjs.extend(customParseFormat);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Main');

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
  logger.log(`Server running on port ${await app.getUrl()}`);
}

bootstrap();
