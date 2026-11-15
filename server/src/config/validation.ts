import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  CLIENT_URL: string = 'http://localhost:5173';

  @IsString()
  @IsOptional()
  DATABASE_URL: string = 'postgresql://postgres:postgres@localhost:5432/ai_whiteboard';

  @IsString()
  @IsOptional()
  JWT_ACCESS_SECRET: string = 'default_jwt_access_secret_key_minimum_32_chars!';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET: string = 'default_jwt_refresh_secret_key_minimum_32_chars!';

  @IsString()
  @IsOptional()
  GEMINI_API_KEY: string = '';

  @IsString()
  @IsOptional()
  S3_ENDPOINT: string = 'http://localhost:9000';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
