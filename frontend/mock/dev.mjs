// Один запуск = тестовый API + Next dev-сервер. Остановка: Ctrl+C (гаснут оба).
import { spawn } from 'node:child_process';
import './server.mjs';
const next = spawn('npx', ['next', 'dev', '-p', '3000'], { stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SOCKET_URL: 'off' } });
next.on('exit', (code) => process.exit(code ?? 0));
