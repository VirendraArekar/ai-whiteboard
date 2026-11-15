import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  // CORS
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin server-to-server)
      if (!origin) return callback(null, true);
      // Allow any localhost or 127.0.0.1 on any port, or configured CLIENT_URL
      if (
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin === clientUrl ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('AI Whiteboard API')
    .setDescription(
      'REST API and WebSocket gateway for AI Whiteboard – full-stack collaborative canvas with Gemini AI',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'bearer-jwt',
    )
    .addTag('Health', 'System health checks')
    .addTag('Authentication', 'User authentication and tokens')
    .addTag('Users', 'User profile and member discovery')
    .addTag('Whiteboards', 'Whiteboards and collaboration permissions')
    .addTag('Elements', 'Canvas elements persistence and batch operations')
    .addTag('AI', 'Google Gemini generative whiteboard assistant')
    .addTag('Uploads', 'S3/MinIO image uploads')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Server listening on http://localhost:${port}/api`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
