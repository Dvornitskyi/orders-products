import http from 'node:http';
import { createApp } from './app';
import { createAuth } from './auth';
import { attachAudit, createEventBus } from './events';
import { createMemoryRepo } from './repo.memory';
import { createMysqlRepo } from './repo.mysql';
import { attachSocket } from './socket';

// STORAGE=memory — без базы (для запуска фронтенда отдельно); по умолчанию — MySQL
const repo = process.env.STORAGE === 'memory' ? createMemoryRepo() : createMysqlRepo();
const bus = createEventBus();
attachAudit(bus);

const server = http.createServer(createApp({ repo, bus, auth: createAuth(repo) }));
attachSocket(server, bus);

await repo.init();
const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => console.log(`API listening on :${port} (storage: ${process.env.STORAGE === 'memory' ? 'memory' : 'mysql'})`));
