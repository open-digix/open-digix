export interface OptimisticUpdateCommand<T> {
  readonly expectedVersion: number;
  readonly updateIfVersionMatches: (
    expectedVersion: number,
  ) => Promise<T | null>;
  readonly getCurrentVersion: () => Promise<number | null>;
}
