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

"use server";

import {
  createApp,
  getCatalogFeatures,
  getDraft,
  getPresets,
  patchDraft,
  validateDraft,
} from "./client";
import type {
  CatalogFeature,
  CatalogPreset,
  FeatureId,
  StartingPoint,
  ValidateDraftIssue,
} from "./types";

export interface CreateAppActionResult {
  ok: boolean;
  appId?: string;
  patchFailed?: boolean;
  code?: string;
  error?: string;
  message?: string;
}

export async function createAppWithFeaturesAction(input: {
  name: string;
  appKey: string;
  startingPoint?: StartingPoint;
  selectedFeatures: FeatureId[];
}): Promise<CreateAppActionResult> {
  try {
    // Step 1: POST /v1/apps
    const created = await createApp({
      schemaVersion: "2.5",
      name: input.name,
      appKey: input.appKey,
      startingPoint: input.startingPoint,
    });

    // Step 2: PATCH /v1/apps/:appId/drafts/:version if features were selected
    if (input.selectedFeatures.length > 0) {
      try {
        await patchDraft(created.appId, {
          lockVersion: created.lockVersion,
          features: input.selectedFeatures.map((id) => ({ id, version: 1 })),
        });
      } catch {
        // Post succeeded but patch failed: do NOT create duplicate app!
        return {
          ok: true,
          appId: created.appId,
          patchFailed: true,
          message:
            "Đã tạo nháp nhưng chưa lưu được chức năng. Bạn có thể tiếp tục cấu hình chức năng trong màn hình quản trị nháp.",
        };
      }
    }

    return {
      ok: true,
      appId: created.appId,
      patchFailed: false,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    return {
      ok: false,
      code: errorObj.code ?? "CREATE_FAILED",
      error: errorObj.message ?? "Không thể tạo ứng dụng.",
    };
  }
}

export async function patchDraftFeaturesAction(
  appId: string,
  lockVersion: number,
  selectedFeatures: FeatureId[],
): Promise<{
  ok: boolean;
  newLockVersion?: number;
  code?: string;
  error?: string;
}> {
  try {
    const updated = await patchDraft(appId, {
      lockVersion,
      features: selectedFeatures.map((id) => ({ id, version: 1 })),
    });
    return {
      ok: true,
      newLockVersion: updated.lockVersion,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    return {
      ok: false,
      code: errorObj.code ?? "PATCH_FAILED",
      error:
        errorObj.code === "CONCURRENCY_CONFLICT"
          ? "Bản nháp đã thay đổi, vui lòng tải lại."
          : (errorObj.message ?? "Không thể cập nhật chức năng."),
    };
  }
}

export async function validateDraftAction(appId: string): Promise<{
  ok: boolean;
  valid: boolean;
  issues: ValidateDraftIssue[];
  error?: string;
}> {
  try {
    const res = await validateDraft(appId);
    return {
      ok: true,
      valid: res.valid,
      issues: res.issues,
    };
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    return {
      ok: false,
      valid: false,
      issues: [],
      error: errorObj.message ?? "Không thể kiểm tra bản nháp.",
    };
  }
}

export async function getAppConfigCatalogAction(): Promise<{
  features: CatalogFeature[];
  presets: CatalogPreset[];
}> {
  const [featRes, presetRes] = await Promise.all([
    getCatalogFeatures(),
    getPresets(),
  ]);
  return {
    features: featRes.features,
    presets: presetRes.presets,
  };
}

export async function getDraftAction(appId: string) {
  try {
    const draft = await getDraft(appId);
    return { ok: true, draft };
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    return { ok: false, error: errorObj.message ?? "Không thể tải bản nháp." };
  }
}
