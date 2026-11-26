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

import { getTenantContext, ApiError, formatApiErrorVi } from "../api/server";
import {
  createApp,
  getCatalogFeatures,
  getDraft,
  getPresets,
  patchDraft,
  validateDraft,
} from "./client";
import type {
  AppDraftDefinitionV25,
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
  status?: number;
  code?: string;
  kind?: string;
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
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        status: 401,
        code: "UNAUTHENTICATED",
        error: "Yêu cầu đăng nhập.",
      };
    }

    const canEdit = context.roles.some((r) => ["designer", "tenant_admin"].includes(r));
    if (!canEdit) {
      return {
        ok: false,
        status: 403,
        code: "FORBIDDEN",
        kind: "forbidden",
        error: "Chỉ vai trò Thiết kế (designer) hoặc Quản trị doanh nghiệp (tenant_admin) mới có quyền thao tác này.",
      };
    }

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
            "Đã tạo bản nháp nhưng chưa lưu được chức năng đã chọn. Bấm \"Sửa chức năng\" để chọn lại.",
        };
      }
    }

    return {
      ok: true,
      appId: created.appId,
      patchFailed: false,
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      const formatted = formatApiErrorVi({
        code: err.code,
        message: err.message,
        issues: err.issues,
      });

      const hasV25Rejection = err.issues?.some(
        (iss) =>
          iss.path === "/schemaVersion" ||
          iss.path === "/startingPoint" ||
          iss.path === "/goal",
      );

      let errorMsg = formatted.title;
      if (formatted.issues.length > 0) {
        errorMsg +=
          ": " +
          formatted.issues
            .map((i) => `${i.fieldLabel} (${i.message})`)
            .join("; ");
      }
      if (hasV25Rejection) {
        errorMsg +=
          " (Backend hiện tại chưa hỗ trợ cấu trúc ứng dụng v2.5; cần cập nhật API backend).";
      }

      return {
        ok: false,
        status: err.status,
        code: err.code,
        kind: err.kind,
        error: errorMsg,
      };
    }

    const errorObj = err as {
      status?: number;
      code?: string;
      message?: string;
      kind?: string;
    };
    return {
      ok: false,
      status: errorObj.status,
      code: errorObj.code ?? "CREATE_FAILED",
      kind: errorObj.kind,
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
  status?: number;
  kind?: string;
  code?: string;
  error?: string;
}> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        status: 401,
        code: "UNAUTHENTICATED",
        error: "Yêu cầu đăng nhập.",
      };
    }

    const canEdit = context.roles.some((r) => ["designer", "tenant_admin"].includes(r));
    if (!canEdit) {
      return {
        ok: false,
        status: 403,
        code: "FORBIDDEN",
        kind: "forbidden",
        error: "Chỉ vai trò Thiết kế (designer) hoặc Quản trị doanh nghiệp (tenant_admin) mới có quyền thao tác này.",
      };
    }

    const updated = await patchDraft(appId, {
      lockVersion,
      features: selectedFeatures.map((id) => ({ id, version: 1 })),
    });
    return {
      ok: true,
      newLockVersion: updated.lockVersion,
    };
  } catch (err: unknown) {
    const errorObj = err as {
      status?: number;
      code?: string;
      message?: string;
      kind?: string;
    };
    const status = errorObj.status;
    const isConflict =
      status === 409 ||
      errorObj.kind === "conflict" ||
      errorObj.code === "VERSION_CONFLICT" ||
      errorObj.code === "CONCURRENCY_CONFLICT";

    return {
      ok: false,
      status: isConflict ? 409 : status,
      kind: isConflict ? "conflict" : errorObj.kind,
      code: isConflict ? "VERSION_CONFLICT" : errorObj.code ?? "PATCH_FAILED",
      error: isConflict
        ? "Bản nháp đã được chỉnh sửa bởi phiên khác. Vui lòng tải lại trang để xem nội dung mới nhất."
        : errorObj.message ?? "Không thể lưu cập nhật chức năng.",
    };
  }
}

export async function getDraftV25Action(appId: string): Promise<{
  ok: boolean;
  draft?: AppDraftDefinitionV25;
  lockVersion?: number;
  error?: string;
}> {
  try {
    const res = await getDraft(appId);
    return {
      ok: true,
      draft: res.definition,
      lockVersion: res.lockVersion,
    };
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    return {
      ok: false,
      error: errorObj.message || "Không thể tải lại bản nháp.",
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

export async function fetchCatalogAction(): Promise<{
  features: CatalogFeature[];
  presets: CatalogPreset[];
}> {
  const [featuresRes, presetsRes] = await Promise.all([
    getCatalogFeatures(),
    getPresets(),
  ]);
  return {
    features: featuresRes.features,
    presets: presetsRes.presets,
  };
}
