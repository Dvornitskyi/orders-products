// Один запуск = настоящий бэкенд без базы (хранилище в памяти) + Next dev-сервер.
// Бэкенд тот же, что в Docker (REST, GraphQL, JWT, WebSocket), отличается только место хранения данных.
// Остановка: Ctrl+C (гаснут оба процесса).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const backendDir = fileURLToPath(new URL('../../backend', import.meta.url));
const run = (cmd, args, opts) => spawn(cmd, args, { stdio: 'inherit', ...opts });

const backend = run('npm', ['run', 'start:memory'], { cwd: backendDir });
const next = run('npx', ['next', 'dev', '-p', '3000']);

const stop = (code = 0) => { backend.kill(); next.kill(); process.exit(code); };
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
backend.on('exit', (code) => { if (code) { console.error('[dev:mock] бэкенд остановился. Выполнили ли вы npm install в папке backend?'); stop(code); } });
next.on('exit', (code) => stop(code ?? 0));
