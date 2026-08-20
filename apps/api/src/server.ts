import 'dotenv/config';
import { buildApp } from './app';
buildApp().then(app => app.listen({ port: Number(process.env.PORT || 3333), host: '0.0.0.0' })).catch(err => { console.error(err); process.exit(1); });
