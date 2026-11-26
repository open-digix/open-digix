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

import type {
  PublishedAppV25,
  NormalizedApp,
  NormalizedPage,
  NormalizedComponent,
} from "./types";

export function normalizeApp(app: PublishedAppV25): NormalizedApp {
  const normalizedPages: NormalizedPage[] = (app.pages || [])
    .map((page, pageIdx) => {
      const menuOrder = typeof page.menuOrder === "number" ? page.menuOrder : pageIdx;
      const hidden = Boolean(page.hidden);

      const normalizedComponents: NormalizedComponent[] = (page.components || [])
        .map((comp, compIdx) => {
          const componentVersion =
            typeof comp.componentVersion === "number" && comp.componentVersion >= 1
              ? comp.componentVersion
              : 1;
          const order = typeof comp.order === "number" ? comp.order : compIdx;
          const compHidden = Boolean(comp.hidden);

          return {
            ...comp,
            componentVersion,
            hidden: compHidden,
            order,
          };
        })
        .sort((a, b) => a.order - b.order);

      return {
        ...page,
        menuOrder,
        hidden,
        components: normalizedComponents,
      };
    })
    .sort((a, b) => a.menuOrder - b.menuOrder);

  return {
    ...app,
    pages: normalizedPages,
  };
}
