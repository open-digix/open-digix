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

export interface ApiIssue {
  readonly code?: string;
  readonly path: string;
  readonly message: string;
}

export type ApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable"
  | "rate_limited"
  | "unavailable";

export function determineErrorKind(status: number): ApiErrorKind {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "unprocessable";
  if (status === 429) return "rate_limited";
  return "unavailable";
}

export interface FormattedApiError {
  title: string;
  issues: { path: string; fieldLabel: string; message: string }[];
  rawMessage?: string;
}

export const FIELD_PATH_LABELS: Record<string, string> = {
  "/inputNotes": "Dữ liệu đầu vào",
  "/roleNotes": "Vai trò & người thực hiện",
  "/stepNotes": "Các bước thực hiện",
  "/branchNotes": "Rẽ nhánh & điều kiện",
  "/outputNotes": "Kết quả đầu ra",
  "/exceptionNotes": "Trường hợp ngoại lệ",
  "/fileRefs": "Tệp đính kèm",
  "/goal": "Mục tiêu quy trình",
  "/sections": "Cấu trúc dữ liệu",
  "/": "Nội dung mô tả",
  "/schemaVersion": "Phiên bản schema",
  "/startingPoint": "Điểm xuất phát",
  "/presetVersion": "Phiên bản mẫu dựng sẵn",
  "/name": "Tên ứng dụng",
  "/appKey": "Mã ứng dụng",
  "/features": "Danh sách chức năng",
};

export const ERROR_CODE_MESSAGES: Record<string, string> = {
  INVALID_SOURCE_INPUT: "Mô tả chưa hợp lệ",
  INVALID_INPUT: "Dữ liệu nhập chưa hợp lệ",
  INVALID_APP_INPUT: "Thông tin ứng dụng chưa hợp lệ",
  APP_KEY_CONFLICT:
    "Mã ứng dụng này đã tồn tại trong doanh nghiệp. Vui lòng chọn mã khác.",
  APP_NOT_FOUND: "Không tìm thấy hoặc bạn không có quyền xem.",
  SOURCE_REVISION_NOT_FOUND: "Không tìm thấy hoặc bạn không có quyền xem.",
  CANNOT_NORMALIZE_NON_DRAFT: "Chỉ có thể chuẩn hóa bản nháp quy trình.",
  MISSING_LOCK_VERSION: "Thiếu phiên bản khóa (lockVersion) khi cập nhật.",
  INVALID_LOCK_VERSION: "Phiên bản khóa không hợp lệ.",
  INVALID_DEFINITION: "Định nghĩa quy trình không hợp lệ.",
  INVALID_DESIGN_METADATA: "Siêu dữ liệu thiết kế không hợp lệ.",
  CANNOT_EDIT_NON_DRAFT: "Chỉ có thể chỉnh sửa bản nháp quy trình.",
  VERSION_CONFLICT:
    "Bản nháp đã được cập nhật bởi phiên làm việc khác. Vui lòng tải lại trang.",
  UNAUTHENTICATED: "Yêu cầu đăng nhập.",
  AUTHENTICATION_REQUIRED: "Yêu cầu đăng nhập.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  TENANT_CONTEXT_REQUIRED: "Vui lòng chọn doanh nghiệp trước khi thao tác.",
  INVALID_TENANT_ID: "Mã doanh nghiệp không hợp lệ.",
  INVALID_APP_ID: "Mã ứng dụng không hợp lệ.",
  INVALID_VERSION: "Phiên bản ứng dụng không hợp lệ.",
  RATE_LIMIT_EXCEEDED: "Hệ thống đang bận. Vui lòng thử lại sau giây lát.",
  APP_TEMPLATE_NOT_AVAILABLE: "Mẫu ứng dụng hiện chưa khả dụng.",
  INTERNAL_ERROR: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
};

export function getFieldLabel(path: string): string {
  if (FIELD_PATH_LABELS[path]) return FIELD_PATH_LABELS[path];
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (FIELD_PATH_LABELS[cleanPath]) return FIELD_PATH_LABELS[cleanPath];
  return path.replace(/^\//, "") || "Dữ liệu";
}

export function formatApiErrorVi(error?: {
  code?: string;
  message?: string;
  issues?: readonly ApiIssue[];
}): FormattedApiError {
  if (!error) {
    return {
      title: "Đã xảy ra lỗi không xác định.",
      issues: [],
    };
  }

  const code = error.code ?? "";
  const title =
    ERROR_CODE_MESSAGES[code] ||
    error.message ||
    "Đã xảy ra lỗi khi xử lý yêu cầu.";

  const formattedIssues = (error.issues ?? []).map((iss) => ({
    path: iss.path,
    fieldLabel: getFieldLabel(iss.path),
    message: iss.message,
  }));

  const rawMessage =
    error.message && error.message !== title ? error.message : undefined;

  return {
    title,
    issues: formattedIssues,
    rawMessage,
  };
}
