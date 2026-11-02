import { defineConfig } from '@playwright/test';

// Функциональные (e2e) тесты: настоящий браузер ходит по настоящему приложению.
// webServer сам поднимает `npm run dev:mock` (бэкенд в памяти + Next), так что ни Docker, ни MySQL не нужны.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: false,   // тесты меняют общие данные в памяти, поэтому идут по очереди
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev:mock',
    url: 'http://localhost:3000/orders',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
