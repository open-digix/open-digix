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

import { Controller, Get } from '@nestjs/common';
import { TenantScoped } from '../identity/tenant-context.decorator';
import type {
  CatalogFeaturesResponse,
  CatalogPresetsResponse,
} from './catalog.types';
import { CatalogService } from './catalog.service';

@TenantScoped()
@Controller('v1/catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('features')
  getFeatures(): CatalogFeaturesResponse {
    return this.catalog.getFeatures();
  }

  @Get('presets')
  getPresets(): CatalogPresetsResponse {
    return this.catalog.getPresets();
  }
}
