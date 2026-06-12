export interface IEnvConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  env: 'dev' | 'staging' | 'prod';
}

const envConfigs: Record<string, IEnvConfig> = {
  dev: {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
    retries: 0,
    env: 'dev',
  },
  staging: {
    baseURL: 'https://staging.example.com',
    timeout: 30000,
    retries: 1,
    env: 'staging',
  },
  prod: {
    baseURL: 'https://www.example.com',
    timeout: 30000,
    retries: 2,
    env: 'prod',
  },
};

const currentEnv = process.env.TEST_ENV || 'dev';

export const EnvConfig: IEnvConfig = envConfigs[currentEnv];
