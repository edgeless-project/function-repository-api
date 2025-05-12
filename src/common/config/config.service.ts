import { parse, DotenvParseOutput } from 'dotenv';
import { readFileSync } from 'fs';
import * as Joi from 'joi';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly envConfig: DotenvParseOutput;

  constructor(filePath: string) {
    const parsedConfig = parse(readFileSync(filePath));
    this.envConfig = this.validateInput(parsedConfig);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(parsedConfig: DotenvParseOutput) {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'provision')
        .default('development'),
      PORT: Joi.number(),
      // API_AUTH_ENABLED: Joi.boolean()
      //   .required()
      //   .default(true),
      // add more validation rules ...
    });

    const validationOptions: Joi.ValidationOptions = { allowUnknown: true };

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      parsedConfig,
      validationOptions,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  /**
   * Generic getter
   */
  get(key: string) {
    if (process.env[key]) {
      return process.env[key];
    } else {
      return this.envConfig[key] || '';
    }
  }

  /**
   * Getters for each environment variable
   */
  public get isDev() {
    return this.get('NODE_ENV') === 'development';
  }

  public isDebug(): boolean {
    return this.get('DEBUG') === 'true';
  }

  public get isProd() {
    return this.get('NODE_ENV') === 'production';
  }

  public get isTest() {
    return this.get('NODE_ENV') === 'test';
  }

  public get databaseHost() {
    return this.get('DATABASE_HOST');
  }

  public get databasePort() {
    return Number(this.get('DATABASE_PORT'));
  }

  public get databaseUsername() {
    return this.get('DATABASE_USERNAME');
  }

  public get databasePassword() {
    return this.get('DATABASE_PASSWORD');
  }

  public get databaseName() {
    return this.get('DATABASE_NAME');
  }

  public get jwtSecret() {
    return this.get('JWT_SECRET');
  }

  public get dbDefaultUsername() {
    return this.get('DATABASE_DEFAULT_USER');
  }

  public get dbDefaultPassword() {
    return this.get('DATABASE_DEFAULT_PASSWORD');
  }

}
