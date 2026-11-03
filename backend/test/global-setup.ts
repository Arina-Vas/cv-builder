import { execSync } from 'node:child_process';
import { assertTestDatabase, TEST_DATABASE_URL } from './test-env';

export default function globalSetup(): void {
  assertTestDatabase(TEST_DATABASE_URL);
  execSync('pnpm exec prisma migrate deploy', {
    cwd: `${__dirname}/..`,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
