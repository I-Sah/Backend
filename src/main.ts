import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('API d\'authentification avec JWT, Google et Facebook')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  const port = process.env.PORT || 5002;
  await app.listen(port);
  
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📖 Documentation available on: http://localhost:${port}/api/docs`);
}
bootstrap();