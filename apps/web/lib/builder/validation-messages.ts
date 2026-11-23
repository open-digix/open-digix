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
  BuilderValidationIssue,
  BuilderApplicationDefinitionV1,
} from "./types";

export const VALIDATION_MESSAGES_VI: Record<string, string> = {
  SCHEMA_VALIDATION_ERROR:
    "Cấu trúc bản nháp chưa đúng định dạng ứng dụng v1",
  NO_ROLES_DEFINED: "Chưa có vai trò nào được khai báo",
  NO_FIELDS_DEFINED: "Chưa có trường dữ liệu nào được khai báo",
  DUPLICATE_ROLE: "Mã vai trò bị trùng lặp",
  DUPLICATE_FIELD: "Mã trường dữ liệu bị trùng lặp",
  DUPLICATE_STEP: "Mã bước xử lý bị trùng lặp",
  INVALID_START_COUNT: "Quy trình phải có đúng một điểm bắt đầu",
  END_STEP_REQUIRED: "Quy trình cần ít nhất một điểm kết thúc",
  END_STATE_REQUIRED: "Điểm kết thúc phải chọn Chấp thuận hoặc Từ chối",
  END_STATE_NOT_ALLOWED: "Trạng thái kết thúc không hợp lệ",
  TASK_ROLE_REQUIRED: "Bước xử lý chưa chọn người phụ trách",
  TASK_MISSING_ROLE: "Bước xử lý chưa chọn người phụ trách",
  UNKNOWN_TASK_ROLE: "Bước xử lý dùng vai trò chưa khai báo",
  UNKNOWN_DECISION_FIELD: "Trường quyết định không tồn tại",
  INVALID_DECISION_FIELD_TYPE:
    "Trường quyết định phải là kiểu lựa chọn (enum) hoặc có-không (boolean)",
  SELF_APPROVAL_RULE_REQUIRES_DECISION:
    "'Không tự duyệt' chỉ dùng cho bước có trường quyết định",
  TASK_PROPERTIES_NOT_ALLOWED: "Thuộc tính này chỉ dùng cho bước xử lý",
  UNKNOWN_TRANSITION_SOURCE: "Đường nối bắt đầu ở bước không tồn tại",
  UNKNOWN_TRANSITION_TARGET: "Đường nối kết thúc ở bước không tồn tại",
  START_HAS_INCOMING_TRANSITION: "Điểm bắt đầu không được có đường vào",
  END_HAS_OUTGOING_TRANSITION: "Điểm kết thúc không được có đường ra",
  GATEWAY_CONDITION_REQUIRED: "Nhánh từ điểm rẽ cần điều kiện",
  UNEXPECTED_TRANSITION_CONDITION:
    "Chỉ đường ra từ điểm rẽ mới có điều kiện",
  MISSING_GATEWAY_BRANCH: "Điểm rẽ chưa bao phủ mọi trường hợp",
  AMBIGUOUS_GATEWAY_BRANCH: "Các nhánh của điểm rẽ bị chồng lấn",
  GATEWAY_ANALYSIS_LIMIT_EXCEEDED:
    "Điều kiện quá phức tạp để kiểm tra tự động",
  UNKNOWN_CONDITION_FIELD: "Điều kiện dùng trường không tồn tại",
  CONDITION_VALUE_TYPE_MISMATCH: "Giá trị trong điều kiện sai kiểu dữ liệu",
  CONDITION_VALUE_NOT_IN_ENUM:
    "Giá trị không có trong danh sách lựa chọn của trường",
  INVALID_CONDITION_OPERATOR: "Phép so sánh không được hỗ trợ",
  ENUM_OPTIONS_REQUIRED: "Trường lựa chọn cần danh sách lựa chọn",
  ENUM_OPTIONS_DEFAULTED:
    "Hệ thống tạm điền lựa chọn mặc định, cần kiểm tra lại",
  INVALID_FIELD_BOUNDS: "Giá trị nhỏ nhất lớn hơn giá trị lớn nhất",
  FIELD_BOUNDS_NOT_SUPPORTED: "Kiểu dữ liệu này không dùng giới hạn min/max",
  FIELD_OPTIONS_NOT_SUPPORTED:
    "Kiểu dữ liệu này không dùng danh sách lựa chọn",
  UNREACHABLE_STEP: "Bước không có đường tới từ điểm bắt đầu",
  NO_PATH_TO_END: "Không đi được tới bất kỳ điểm kết thúc nào",
  WORKFLOW_CYCLE_NOT_SUPPORTED:
    "Quy trình có vòng lặp (phiên bản v1 chưa hỗ trợ)",
  UNHANDLED_EXCEPTION_NOTE:
    "Ngoại lệ trong mô tả chưa được đưa vào quy trình: ",
};

export function getValidationMessageVi(
  issue: BuilderValidationIssue,
  definition?: BuilderApplicationDefinitionV1,
): string {
  if (issue.code === "UNHANDLED_EXCEPTION_NOTE") {
    const rawNote = issue.message.replace(/^UNHANDLED_EXCEPTION_NOTE:?\s*/i, "").trim();
    return `Ngoại lệ trong mô tả chưa được đưa vào quy trình: ${rawNote || issue.message}`;
  }

  const path = issue.path || "";

  // Check transitions
  const transMatch = path.match(/transitions[/.\[](\d+)/);
  if (transMatch) {
    const idx = parseInt(transMatch[1], 10);
    const trans = definition?.transitions?.[idx];
    const transNum = idx + 1;

    if (issue.code === "UNKNOWN_TRANSITION_TARGET") {
      const target = trans?.to || issue.message.match(/'([^']+)'/)?.[1] || "";
      return target
        ? `Nhánh thứ ${transNum} trỏ tới bước '${target}' chưa khai báo`
        : `Nhánh thứ ${transNum} trỏ tới bước chưa khai báo`;
    }
    if (issue.code === "UNKNOWN_TRANSITION_SOURCE") {
      const source = trans?.from || issue.message.match(/'([^']+)'/)?.[1] || "";
      return source
        ? `Nhánh thứ ${transNum} bắt đầu từ bước '${source}' chưa khai báo`
        : `Nhánh thứ ${transNum} bắt đầu từ bước chưa khai báo`;
    }
    if (issue.code === "GATEWAY_CONDITION_REQUIRED") {
      return `Nhánh thứ ${transNum} từ điểm rẽ '${trans?.from || ""}' cần điều kiện`;
    }
    if (issue.code === "UNEXPECTED_TRANSITION_CONDITION") {
      return `Nhánh thứ ${transNum} không phải từ điểm rẽ nên không được có điều kiện`;
    }
  }

  // Check steps
  const stepMatch = path.match(/steps[/.\[](\d+)/);
  if (stepMatch) {
    const idx = parseInt(stepMatch[1], 10);
    const step = definition?.steps?.[idx];
    const stepId = step?.id || issue.stepId || `thứ ${idx + 1}`;

    if (issue.code === "TASK_ROLE_REQUIRED" || issue.code === "TASK_MISSING_ROLE") {
      return `Bước '${stepId}' chưa chọn người phụ trách`;
    }
    if (issue.code === "UNKNOWN_TASK_ROLE") {
      const rName = step?.role || issue.message.match(/'([^']+)'/)?.[1] || "";
      return rName
        ? `Bước '${stepId}' dùng vai trò '${rName}' chưa khai báo`
        : `Bước '${stepId}': Bước xử lý dùng vai trò chưa khai báo`;
    }
    if (issue.code === "UNKNOWN_DECISION_FIELD") {
      const fName = step?.decisionField || issue.message.match(/'([^']+)'/)?.[1] || "";
      return fName
        ? `Bước '${stepId}' dùng trường quyết định '${fName}' không tồn tại`
        : `Bước '${stepId}': Trường quyết định không tồn tại`;
    }
    if (issue.code === "INVALID_DECISION_FIELD_TYPE") {
      const fName = step?.decisionField || issue.message.match(/'([^']+)'/)?.[1] || "";
      return fName
        ? `Bước '${stepId}' có trường quyết định '${fName}' phải là kiểu enum hoặc boolean`
        : `Bước '${stepId}': Trường quyết định phải là kiểu enum hoặc boolean`;
    }
    if (issue.code === "UNREACHABLE_STEP") {
      return `Bước '${stepId}' không có đường tới từ điểm bắt đầu`;
    }
    if (issue.code === "NO_PATH_TO_END") {
      return `Bước '${stepId}' không có đường tới bất kỳ điểm kết thúc nào`;
    }
  }

  // Check fields
  const fieldMatch = path.match(/fields[/.\[](\d+)/);
  if (fieldMatch) {
    const idx = parseInt(fieldMatch[1], 10);
    const field = definition?.fields?.[idx];
    const fieldId = field?.id || `thứ ${idx + 1}`;

    if (issue.code === "INVALID_FIELD_BOUNDS") {
      return `Trường '${fieldId}' có giá trị nhỏ nhất lớn hơn giá trị lớn nhất`;
    }
    if (issue.code === "ENUM_OPTIONS_REQUIRED") {
      return `Trường '${fieldId}' kiểu lựa chọn cần danh sách lựa chọn`;
    }
    if (issue.code === "DUPLICATE_FIELD") {
      return `Mã trường '${fieldId}' bị trùng lặp`;
    }
  }

  if (issue.stepId) {
    const base = VALIDATION_MESSAGES_VI[issue.code] || issue.message;
    return `Bước '${issue.stepId}': ${base}`;
  }

  return VALIDATION_MESSAGES_VI[issue.code] || issue.message;
}
