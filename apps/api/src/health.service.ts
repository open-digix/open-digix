import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { getDatabaseConfig } from './database/database.config';

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly pool = new Pool(getDatabaseConfig());

  async check(): Promise<{ status: string; database: string }> {
    try {
      await this.pool.query('SELECT 1');
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
