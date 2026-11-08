import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database/database.module';

@Injectable()
export class HealthService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async check(): Promise<{ status: string; database: string }> {
    try {
      await this.pool.query('SELECT 1');
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
