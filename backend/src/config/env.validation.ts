import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsUrl({ require_tld: false })
  FRONTEND_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsInt()
  @Min(60)
  JWT_ACCESS_TTL_SECONDS!: number;

  @IsInt()
  @Min(1)
  REFRESH_TTL_DAYS!: number;

  @IsString()
  @IsNotEmpty()
  SMTP_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT!: number;

  @IsString()
  @IsNotEmpty()
  MAIL_FROM!: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  S3_ENDPOINT!: string;

  // MinIO ignores the region, but the S3 client requires one
  @IsString()
  @IsNotEmpty()
  S3_REGION: string = 'us-east-1';

  @IsString()
  @IsNotEmpty()
  S3_ACCESS_KEY!: string;

  @IsString()
  @IsNotEmpty()
  S3_SECRET_KEY!: string;

  @IsString()
  @IsNotEmpty()
  S3_BUCKET!: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  S3_PUBLIC_URL!: string;

  // Implicit conversion turns any non-empty string into true, so read the raw value
  @Transform(({ obj }: { obj: Record<string, unknown> }) => obj['S3_FORCE_PATH_STYLE'] === 'true')
  @IsBoolean()
  S3_FORCE_PATH_STYLE: boolean = false;

  @IsInt()
  @Min(0)
  TRUST_PROXY_HOPS: number = 0;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const names = errors.map((error) => error.property).join(', ');
    throw new Error(`Invalid environment variables: ${names}`);
  }
  return validated;
}
