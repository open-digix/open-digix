export interface FeatureModuleContext {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly input: unknown;
}

export type FeatureModuleHandler = (
  context: FeatureModuleContext,
) => Promise<unknown>;

export interface FeatureModuleDefinition {
  readonly featureId: string;
  readonly version: number;
  readonly route: string;
  readonly permissions: readonly string[];
  readonly metric: string;
  readonly handler: FeatureModuleHandler;
}
