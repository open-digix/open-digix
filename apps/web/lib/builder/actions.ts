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

import { apiCall, ApiError, getTenantContext } from "../api/server";
import { isValidUUID, isValidVersion } from "./types";
import type {
  BuilderApplicationDefinitionV1,
  BuilderDesignMetadata,
  BuilderSourceSegment,
  BuilderValidationResult,
} from "./types";

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    issues?: readonly { path: string; message: string }[];
  };
}

function checkBuilderPermission(
  roles: string[],
  requireEditor = true,
): void {
  if (requireEditor) {
    const canEdit = roles.some((r) => ["designer", "tenant_admin"].includes(r));
    if (!canEdit) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Chỉ vai trò Thiết kế (designer) hoặc Quản trị doanh nghiệp (tenant_admin) mới có quyền thao tác này.",
      );
    }
  } else {
    const canView = roles.some((r) =>
      ["designer", "publisher", "tenant_admin"].includes(r),
    );
    if (!canView) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Bạn không có quyền truy cập quy trình này.",
      );
    }
  }
}

export async function createAppAction(input: {
  name: string;
  appKey: string;
  goal?: string;
  departments?: string;
}): Promise<
  ActionResult<{
    appId: string;
    appKey: string;
    name: string;
    version: number;
    lockVersion: number;
  }>
> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập." },
      };
    }
    checkBuilderPermission(context.roles, true);

    const name = input.name.trim();
    const appKey = input.appKey.trim();

    if (!name) {
      return {
        ok: false,
        error: { code: "INVALID_INPUT", message: "Tên ứng dụng không được để trống." },
      };
    }

    if (!/^[a-z][a-z0-9_-]{1,63}$/.test(appKey)) {
      return {
        ok: false,
        error: {
          code: "INVALID_APP_KEY",
          message:
            "Mã ứng dụng phải bắt đầu bằng chữ thường, gồm chữ thường, số, '-' hoặc '_', từ 2 đến 64 ký tự.",
        },
      };
    }

    const departmentRefs = input.departments
      ? input.departments
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : undefined;

    const data = await apiCall<{
      appId: string;
      appKey: string;
      name: string;
      status: string;
      version: number;
      lockVersion: number;
    }>("/v1/apps", {
      method: "POST",
      body: {
        appKey,
        name,
        goal: input.goal?.trim() || undefined,
        departmentRefs,
      },
    });

    return {
      ok: true,
      data: {
        appId: data.appId,
        appKey: data.appKey,
        name: data.name,
        version: data.version,
        lockVersion: data.lockVersion,
      },
    };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          issues: err.issues,
        },
      };
    }
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Không thể tạo ứng dụng." },
    };
  }
}

export async function saveDescriptionsAction(
  appId: string,
  sections: Record<string, string>,
): Promise<
  ActionResult<{
    sourceRevisionId: string;
    revisionNo: number;
    segments: readonly BuilderSourceSegment[];
  }>
> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập." },
      };
    }
    checkBuilderPermission(context.roles, true);

    if (!isValidUUID(appId)) {
      return {
        ok: false,
        error: { code: "INVALID_APP_ID", message: "Mã ứng dụng không hợp lệ." },
      };
    }

    const inputNotes = sections.inputs?.trim();
    const roleNotes = sections.roles?.trim();
    const stepNotes = sections.steps?.trim();
    const branchNotes = sections.branches?.trim();
    const outputNotes = sections.outputs?.trim();
    const exceptionNotes = sections.exceptions?.trim();

    if (
      !inputNotes &&
      !roleNotes &&
      !stepNotes &&
      !branchNotes &&
      !outputNotes &&
      !exceptionNotes
    ) {
      return {
        ok: false,
        error: {
          code: "INVALID_SOURCE_INPUT",
          message: "Cần nhập ít nhất một mục mô tả.",
        },
      };
    }

    const body: Record<string, unknown> = {
      fileRefs: [],
    };
    if (inputNotes) body.inputNotes = inputNotes;
    if (roleNotes) body.roleNotes = roleNotes;
    if (stepNotes) body.stepNotes = stepNotes;
    if (branchNotes) body.branchNotes = branchNotes;
    if (outputNotes) body.outputNotes = outputNotes;
    if (exceptionNotes) body.exceptionNotes = exceptionNotes;

    const data = await apiCall<{
      sourceRevisionId: string;
      revisionNo: number;
      segments: readonly BuilderSourceSegment[];
    }>(`/v1/apps/${appId}/descriptions`, {
      method: "POST",
      body,
    });

    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          issues: err.issues,
        },
      };
    }
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Không thể lưu mô tả nguồn." },
    };
  }
}

export interface NormalizeResult {
  definition: BuilderApplicationDefinitionV1;
  sourceMappings: BuilderDesignMetadata["sourceMappings"];
  openIssues: BuilderDesignMetadata["openIssues"];
  lockVersion: number;
  revisionNo: number;
  snapshotChecksum: string;
}

export async function normalizeDraftAction(
  appId: string,
  version: number,
  sourceRevisionId?: string,
): Promise<ActionResult<NormalizeResult>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập." },
      };
    }
    checkBuilderPermission(context.roles, true);

    if (!isValidUUID(appId)) {
      return {
        ok: false,
        error: { code: "INVALID_APP_ID", message: "Mã ứng dụng không hợp lệ." },
      };
    }

    if (!isValidVersion(version)) {
      return {
        ok: false,
        error: { code: "INVALID_VERSION", message: "Phiên bản không hợp lệ." },
      };
    }

    const data = await apiCall<NormalizeResult>(
      `/v1/apps/${appId}/drafts/${version}/normalize`,
      {
        method: "POST",
        body: sourceRevisionId ? { sourceRevisionId } : {},
      },
    );

    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          issues: err.issues,
        },
      };
    }
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Không thể chuẩn hóa bản nháp." },
    };
  }
}

export async function getDraftAction(
  appId: string,
  version: number,
): Promise<
  ActionResult<{
    definition: BuilderApplicationDefinitionV1;
    sourceMappings: BuilderDesignMetadata["sourceMappings"];
    openIssues: BuilderDesignMetadata["openIssues"];
    lockVersion: number;
    revisionNo: number;
  }>
> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập." },
      };
    }
    checkBuilderPermission(context.roles, false);

    if (!isValidUUID(appId)) {
      return {
        ok: false,
        error: { code: "INVALID_APP_ID", message: "Mã ứng dụng không hợp lệ." },
      };
    }

    if (!isValidVersion(version)) {
      return {
        ok: false,
        error: { code: "INVALID_VERSION", message: "Phiên bản không hợp lệ." },
      };
    }

    const data = await apiCall<{
      definition: BuilderApplicationDefinitionV1;
      sourceMappings?: BuilderDesignMetadata["sourceMappings"];
      openIssues?: BuilderDesignMetadata["openIssues"];
      lockVersion: number;
      revisionNo: number;
    }>(`/v1/apps/${appId}/drafts/${version}`, {
      method: "GET",
    });

    return {
      ok: true,
      data: {
        definition: data.definition,
        sourceMappings: data.sourceMappings ?? [],
        openIssues: data.openIssues ?? [],
        lockVersion: data.lockVersion,
        revisionNo: data.revisionNo,
      },
    };
  } catch (err) {
    if (
      err instanceof ApiError ||
      (err !== null &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name: unknown }).name === "ApiError")
    ) {
      const apiErr = err as ApiError;
      return {
        ok: false,
        error: {
          code: apiErr.code,
          message: apiErr.message,
          details: apiErr.details,
          issues: apiErr.issues,
        },
      };
    }
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Không thể tải bản nháp." },
    };
  }
}

export async function updateDraftAction(
  appId: string,
  version: number,
  lockVersion: number,
  definition: BuilderApplicationDefinitionV1,
  designMetadata?: BuilderDesignMetadata,
): Promise<
  ActionResult<{
    lockVersion: number;
    revisionNo: number;
    snapshotChecksum: string;
  }>
> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập." },
      };
    }
    checkBuilderPermission(context.roles, true);

    if (!isValidUUID(appId)) {
      return {
        ok: false,
        error: { code: "INVALID_APP_ID", message: "Mã ứng dụng không hợp lệ." },
      };
    }

    if (!isValidVersion(version)) {
      return {
        ok: false,
        error: { code: "INVALID_VERSION", message: "Phiên bản không hợp lệ." },
      };
    }

    const data = await apiCall<{
      lockVersion: number;
      revisionNo: number;
      snapshotChecksum: string;
    }>(`/v1/apps/${appId}/drafts/${version}`, {
      method: "PATCH",
      body: {
        lockVersion,
        definition,
        designMetadata,
      },
    });

    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          issues: err.issues,
        },
      };
    }
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Không thể lưu bản nháp." },
    };
  }
}

export async function validateDraftAction(
  appId: string,
  version: number,
): Promise<ActionResult<BuilderValidationResult>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập." },
      };
    }
    checkBuilderPermission(context.roles, false);

    if (!isValidUUID(appId)) {
      return {
        ok: false,
        error: { code: "INVALID_APP_ID", message: "Mã ứng dụng không hợp lệ." },
      };
    }

    if (!isValidVersion(version)) {
      return {
        ok: false,
        error: { code: "INVALID_VERSION", message: "Phiên bản không hợp lệ." },
      };
    }

    const data = await apiCall<BuilderValidationResult>(
      `/v1/apps/${appId}/drafts/${version}/validate`,
      {
        method: "POST",
        body: {},
      },
    );

    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          issues: err.issues,
        },
      };
    }
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Không thể kiểm tra quy trình." },
    };
  }
}
