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

import type { RegistrationErrorCode, RegistrationTargetField } from "./types";

export interface ErrorMapping {
  message: string;
  field: RegistrationTargetField;
}

export const REGISTRATION_ERROR_MAPPINGS: Record<RegistrationErrorCode, ErrorMapping> = {
  TENANT_SLUG_TAKEN: {
    message: "Mã doanh nghiệp đã được dùng, hãy chọn mã khác.",
    field: "tenantSlug",
  },
  EMAIL_TAKEN: {
    message: "Email này đã được đăng ký, vui lòng dùng email khác.",
    field: "email",
  },
  USERNAME_TAKEN: {
    message: "Tên đăng nhập này đã tồn tại, hãy chọn tên khác.",
    field: "username",
  },
  VALIDATION_FAILED: {
    message: "Thông tin đăng ký chưa hợp lệ, vui lòng kiểm tra lại các trường.",
    field: "general",
  },
  RATE_LIMITED: {
    message: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.",
    field: "general",
  },
  UNAVAILABLE: {
    message: "Hệ thống đăng ký hiện đang bận hoặc không thể kết nối. Vui lòng thử lại sau.",
    field: "general",
  },
};

export function getRegistrationErrorMessage(code: RegistrationErrorCode): ErrorMapping {
  return (
    REGISTRATION_ERROR_MAPPINGS[code] ?? {
      message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
      field: "general",
    }
  );
}
