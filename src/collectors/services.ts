import { SSHExecutor } from '../ssh/executor.js';

export class ServicesCollector {
  constructor(private executor: SSHExecutor) {}

  async extractCredentials(containers: any[]): Promise<Record<string, any>> {
    const services: Record<string, any> = {};

    for (const container of containers) {
      try {
        const inspectResult = await this.executor.executeCommand(`docker inspect ${container.Names}`);
        const inspect = JSON.parse(inspectResult)[0];
        
        const env = inspect.Config?.Env || [];
        const name = container.Names.replace(/^\//, '');

        if (name.includes('postgres') || name.includes('db')) {
          const dbConfig: any = { type: 'postgresql' };
          for (const envVar of env) {
            if (envVar.startsWith('POSTGRES_USER=')) dbConfig.username = envVar.split('=')[1];
            if (envVar.startsWith('POSTGRES_PASSWORD=')) dbConfig.password = envVar.split('=')[1];
            if (envVar.startsWith('POSTGRES_DB=')) dbConfig.database = envVar.split('=')[1];
          }
          if (inspect.NetworkSettings?.Ports?.['5432/tcp']) {
            dbConfig.port = inspect.NetworkSettings.Ports['5432/tcp'][0]?.HostPort || 5432;
          }
          services[name] = dbConfig;
        }

        if (name.includes('redis')) {
          const redisConfig: any = { type: 'redis' };
          if (inspect.NetworkSettings?.Ports?.['6379/tcp']) {
            redisConfig.port = inspect.NetworkSettings.Ports['6379/tcp'][0]?.HostPort || 6379;
          }
          services[name] = redisConfig;
        }

        if (name.includes('mongo')) {
          const mongoConfig: any = { type: 'mongodb' };
          for (const envVar of env) {
            if (envVar.startsWith('MONGO_INITDB_ROOT_USERNAME=')) mongoConfig.username = envVar.split('=')[1];
            if (envVar.startsWith('MONGO_INITDB_ROOT_PASSWORD=')) mongoConfig.password = envVar.split('=')[1];
          }
          if (inspect.NetworkSettings?.Ports?.['27017/tcp']) {
            mongoConfig.port = inspect.NetworkSettings.Ports['27017/tcp'][0]?.HostPort || 27017;
          }
          services[name] = mongoConfig;
        }
      } catch {}
    }

    return services;
  }
}