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

import { Injectable } from '@nestjs/common';
import { CATALOG_FEATURES, CATALOG_PRESETS } from './catalog.registry';
import {
  CATALOG_VERSION,
  type CatalogFeature,
  type CatalogFeaturesResponse,
  type CatalogPreset,
  type CatalogPresetsResponse,
} from './catalog.types';

function copyFeature(value: CatalogFeature): CatalogFeature {
  return {
    ...value,
    resources: [...value.resources],
    actions: [...value.actions],
    permissions: [...value.permissions],
    dependencies: [...value.dependencies],
    components: [...value.components],
  };
}

function copyPreset(value: CatalogPreset): CatalogPreset {
  return {
    ...value,
    suggestedFeatures: [...value.suggestedFeatures],
  };
}

@Injectable()
export class CatalogService {
  getFeatures(): CatalogFeaturesResponse {
    return {
      catalogVersion: CATALOG_VERSION,
      features: CATALOG_FEATURES.map(copyFeature),
    };
  }

  getFeature(featureId: string): CatalogFeature | undefined {
    const feature = CATALOG_FEATURES.find((item) => item.id === featureId);
    return feature ? copyFeature(feature) : undefined;
  }

  getPresets(): CatalogPresetsResponse {
    return {
      catalogVersion: CATALOG_VERSION,
      presets: CATALOG_PRESETS.map(copyPreset),
    };
  }

  getPreset(presetId: CatalogPreset['id']): CatalogPreset | undefined {
    const preset = CATALOG_PRESETS.find((item) => item.id === presetId);
    return preset ? copyPreset(preset) : undefined;
  }
}
