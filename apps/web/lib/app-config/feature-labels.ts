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

export interface FeatureLabelInfo {
  label: string;
  description: string;
  domainLabel: string;
}

export const FEATURE_LABELS: Record<string, FeatureLabelInfo> = {
  "erp.materials": {
    label: "Quản lý vật tư",
    description: "Quản lý danh mục vật tư, đơn vị tính, quy cách và chia sẻ ghi chú giữa các ứng dụng.",
    domainLabel: "Quản lý nguồn lực (ERP)",
  },
  "erp.purchase_requests": {
    label: "Yêu cầu mua hàng",
    description: "Tạo, gửi duyệt và phê duyệt đề xuất mua vật tư theo quy trình nhiều cấp.",
    domainLabel: "Quản lý nguồn lực (ERP)",
  },
  "erp.inventory": {
    label: "Quản lý kho & Nhập hàng",
    description: "Ghi nhận phiếu nhập kho dựa trên yêu cầu mua đã duyệt và theo dõi tồn kho tức thời.",
    domainLabel: "Quản lý nguồn lực (ERP)",
  },
  "crm.customers": {
    label: "Quản lý khách hàng & Liên hệ",
    description: "Lưu trữ thông tin khách hàng doanh nghiệp, người liên hệ và lịch sử tương tác.",
    domainLabel: "Quan hệ khách hàng (CRM)",
  },
  "crm.opportunities": {
    label: "Cơ hội bán hàng",
    description: "Theo dõi quy trình bán hàng qua từng giai đoạn từ tạo mới, đánh giá tới thành công.",
    domainLabel: "Quan hệ khách hàng (CRM)",
  },
};

export const PRESET_LABELS: Record<string, { label: string; description: string }> = {
  erp: {
    label: "Bắt đầu với ERP",
    description: "Gợi ý sẵn bộ 3 chức năng: Quản lý vật tư, Yêu cầu mua hàng và Quản lý kho.",
  },
  crm: {
    label: "Bắt đầu với CRM",
    description: "Gợi ý sẵn bộ 2 chức năng: Quản lý khách hàng và Cơ hội bán hàng.",
  },
  blank: {
    label: "Tạo từ trống",
    description: "Không chọn sẵn chức năng nào; tự do lựa chọn và tùy biến cấu hình theo nhu cầu riêng.",
  },
};

/**
 * Returns user-friendly Vietnamese label for a feature id.
 * Falls back to feature id if not found in dictionary.
 */
export function getFeatureLabel(featureId: string): string {
  return FEATURE_LABELS[featureId]?.label ?? featureId;
}

/**
 * Returns description for a feature id, falling back to empty string.
 */
export function getFeatureDescription(featureId: string): string {
  return FEATURE_LABELS[featureId]?.description ?? "";
}

/**
 * Returns domain label for a domain code.
 */
export function getDomainLabel(domain: string): string {
  if (domain === "erp") return "Quản lý nguồn lực (ERP)";
  if (domain === "crm") return "Quan hệ khách hàng (CRM)";
  return domain.toUpperCase();
}
