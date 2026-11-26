/*
 * Copyright 2026 DigiX Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { CatalogFeature, FeatureId } from "./types";

/**
 * Calculates missing dependencies for a list of selected features against the catalog.
 * Returns an array of feature IDs that are required by the selected features but not yet selected.
 */
export function getMissingDependencies(
  selectedFeatureIds: readonly FeatureId[],
  catalogFeatures: readonly CatalogFeature[],
): FeatureId[] {
  const selectedSet = new Set(selectedFeatureIds);
  const missing = new Set<FeatureId>();

  const featureMap = new Map<FeatureId, CatalogFeature>(
    catalogFeatures.map((f) => [f.id, f]),
  );

  for (const id of selectedFeatureIds) {
    const feat = featureMap.get(id);
    if (!feat || !feat.dependencies) continue;

    for (const depId of feat.dependencies) {
      if (!selectedSet.has(depId)) {
        missing.add(depId);
      }
    }
  }

  return Array.from(missing);
}

/**
 * Calculates which currently selected features would be broken/affected
 * if `featureToRemove` is deselected.
 * Returns an array of dependent feature IDs.
 */
export function getAffectedDependents(
  featureToRemove: FeatureId,
  selectedFeatureIds: readonly FeatureId[],
  catalogFeatures: readonly CatalogFeature[],
): FeatureId[] {
  const featureMap = new Map<FeatureId, CatalogFeature>(
    catalogFeatures.map((f) => [f.id, f]),
  );

  const affected: FeatureId[] = [];

  for (const id of selectedFeatureIds) {
    if (id === featureToRemove) continue;
    const feat = featureMap.get(id);
    if (!feat || !feat.dependencies) continue;

    if (feat.dependencies.includes(featureToRemove)) {
      affected.push(id);
    }
  }

  return affected;
}
