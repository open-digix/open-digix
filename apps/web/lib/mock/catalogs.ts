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

// DỮ LIỆU MẪU THỬ - CHỈ DÙNG CHO PROTOTYPE GIAO DIỆN KHI CHƯA CÓ API THẬT

export interface MockApp {
  id: string;
  name: string;
  desc: string;
  version: string;
  status: "published" | "draft";
  icon: string;
  tone?: string;
}

export interface MockTask {
  id: string;
  title: string;
  app: string;
  from: string;
  step: string;
  due: string;
  status: "pending" | "done" | "rejected";
  amount: string;
  reason: string;
}

export interface MockRecord {
  id: string;
  title: string;
  app: string;
  updated: string;
  status: "pending" | "approved" | "draft" | "rejected";
  detail: string;
  version: string;
}

export const SAMPLE_APPS: MockApp[] = [
  {
    id: "purchase",
    name: "Đề nghị mua sắm",
    desc: "Tiếp nhận và phê duyệt đề xuất mua sắm nội bộ",
    version: "v1.0",
    status: "published",
    icon: "ĐM",
    tone: "",
  },
  {
    id: "leave",
    name: "Đăng ký nghỉ phép",
    desc: "Quản lý đơn nghỉ phép và tuyến phê duyệt",
    version: "v1.0",
    status: "published",
    icon: "NP",
    tone: "blue",
  },
  {
    id: "onboard",
    name: "Tiếp nhận nhân sự",
    desc: "Chuẩn bị hồ sơ và phân công đầu việc",
    version: "v0.2",
    status: "draft",
    icon: "NS",
    tone: "gold",
  },
];

export const SAMPLE_TASKS: MockTask[] = [
  {
    id: "CV-024",
    title: "Đề nghị mua laptop cho nhóm thiết kế",
    app: "Đề nghị mua sắm",
    from: "Nguyễn Hoàng Nam",
    step: "Quản lý duyệt",
    due: "18/11/2026",
    status: "pending",
    amount: "24.500.000 đ",
    reason: "Thiết bị phục vụ dự án mới",
  },
  {
    id: "CV-025",
    title: "Đăng ký nghỉ phép 04 ngày",
    app: "Đăng ký nghỉ phép",
    from: "Trần Thu Hà",
    step: "Quản lý duyệt",
    due: "19/11/2026",
    status: "pending",
    amount: "04 ngày",
    reason: "Nghỉ phép năm",
  },
  {
    id: "CV-019",
    title: "Đề nghị mua vật tư văn phòng",
    app: "Đề nghị mua sắm",
    from: "Lê Khánh Linh",
    step: "Hoàn tất",
    due: "14/11/2026",
    status: "done",
    amount: "2.300.000 đ",
    reason: "Bổ sung vật tư định kỳ",
  },
];

export const SAMPLE_RECORDS: MockRecord[] = [
  {
    id: "HS-101",
    title: "Đề nghị mua màn hình bổ sung",
    app: "Đề nghị mua sắm",
    updated: "15/11/2026",
    status: "pending",
    detail: "Màn hình 27 inch · 2 chiếc",
    version: "v1.0",
  },
  {
    id: "HS-098",
    title: "Đăng ký nghỉ phép 02 ngày",
    app: "Đăng ký nghỉ phép",
    updated: "12/11/2026",
    status: "approved",
    detail: "20–21/11/2026 · Nghỉ phép năm",
    version: "v1.0",
  },
  {
    id: "HS-095",
    title: "Đề nghị mua bàn làm việc",
    app: "Đề nghị mua sắm",
    updated: "09/11/2026",
    status: "draft",
    detail: "Bàn làm việc · 1 chiếc",
    version: "v1.0",
  },
];
