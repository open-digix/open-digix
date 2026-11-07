import { migrateDatabase } from './migration-runner';

void migrateDatabase()
  .then((result) => {
    const applied = result.applied.join(', ') || 'none';
    const skipped = result.skipped.join(', ') || 'none';
    console.log(`Database migrations applied: ${applied}`);
    console.log(`Database migrations skipped: ${skipped}`);
  })
  .catch((error: unknown) => {
    console.error('Database migration failed', error);
    process.exitCode = 1;
  });
