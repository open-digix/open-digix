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
  AiAskResponse,
  AiSource,
  AiAppOption,
  AiHistoryItem,
} from "./types";

let mockUnavailable = false;

export function setMockUnavailable(val: boolean) {
  mockUnavailable = val;
}

export function isMockUnavailable(): boolean {
  return mockUnavailable;
}

export function getAssistantApiMode(): "mock" | "api" {
  const mode = process.env.NEXT_PUBLIC_ASSISTANT_API_MODE?.trim().toLowerCase();
  return mode === "api" ? "api" : "mock";
}

export const MOCK_APPS: AiAppOption[] = [
  {
    id: "app-erp",
    name: "Mua sắm – Kho (ERP)",
    key: "erp",
    hasSources: true,
  },
  {
    id: "app-crm",
    name: "Khách hàng (CRM)",
    key: "crm",
    hasSources: false,
  },
];

export const MOCK_ERP_SOURCES: AiSource[] = [
  {
    id: "src-1",
    number: 1,
    name: "Quy chế mua sắm nội bộ",
    type: "Tài liệu",
    version: "phiên bản 3",
    updatedAt: "12/11/2026",
    status: "active",
    snippet:
      "Mục 4.2: Yêu cầu trên 50.000.000 đ do trưởng bộ phận và kế toán trưởng lần lượt duyệt. (Nội dung MẪU THỬ)",
  },
  {
    id: "src-2",
    number: 2,
    name: "Cấu hình ứng dụng đã xuất bản",
    type: "Ứng dụng Mua sắm – Kho",
    version: "bản v1.2",
    status: "active",
  },
  {
    id: "src-3",
    number: 3,
    name: "Danh mục vật tư",
    type: "Dữ liệu ứng dụng",
    version: "chỉ đọc",
    status: "active",
  },
  {
    id: "src-4",
    number: 4,
    name: "Hướng dẫn kiểm kê cuối năm",
    type: "Tài liệu",
    status: "scanning",
  },
];

export const MOCK_INITIAL_HISTORY: AiHistoryItem[] = [
  {
    id: "hist-1",
    appId: "app-erp",
    appName: "Mua sắm – Kho",
    title: "Duyệt yêu cầu mua trên 50 triệu",
    timestamp: "15:40",
    group: "today",
  },
  {
    id: "hist-2",
    appId: "app-erp",
    appName: "Mua sắm – Kho",
    title: "Nhập kho khi đã duyệt một phần",
    timestamp: "10:12",
    group: "today",
  },
  {
    id: "hist-3",
    appId: "app-crm",
    appName: "Khách hàng (CRM)",
    title: "Các giai đoạn của cơ hội bán hàng",
    timestamp: "21/11",
    group: "past_7_days",
  },
  {
    id: "hist-4",
    appId: "app-erp",
    appName: "Mua sắm – Kho",
    title: "Mã vật tư có được trùng không?",
    timestamp: "20/11",
    group: "past_7_days",
  },
];

export async function listAiApps(): Promise<AiAppOption[]> {
  return MOCK_APPS;
}

export async function listSources(appId: string): Promise<AiSource[]> {
  if (getAssistantApiMode() === "api") {
    const res = await fetch(`/v1/apps/${encodeURIComponent(appId)}/ai/sources`);
    if (!res.ok) throw new Error("Không thể tải danh sách nguồn");
    return res.json();
  }

  if (appId === "app-erp" || appId === "erp") {
    return MOCK_ERP_SOURCES;
  }
  return [];
}

export async function ask(
  appId: string,
  question: string,
  options?: { forceUnavailable?: boolean }
): Promise<AiAskResponse> {
  if (options?.forceUnavailable || mockUnavailable) {
    return { status: "unavailable" };
  }

  if (getAssistantApiMode() === "api") {
    const res = await fetch(`/v1/apps/${encodeURIComponent(appId)}/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) {
      if (res.status === 503) return { status: "unavailable" };
      throw new Error("Lỗi khi gửi câu hỏi tới AI");
    }
    return res.json();
  }

  // Dữ liệu mẫu MẪU THỬ:
  const qNorm = question.trim().toLowerCase();

  // Nhận diện câu hỏi mẫu về duyệt yêu cầu mua trên 50 triệu
  if (
    (qNorm.includes("50 triệu") ||
      (qNorm.includes("duyệt") && (qNorm.includes("mua") || qNorm.includes("ai")))) &&
    (appId === "app-erp" || appId === "erp")
  ) {
    return {
      status: "answered",
      answerIntro:
        "Với ứng dụng Mua sắm – Kho, yêu cầu mua có tổng giá trị trên 50.000.000 đ cần qua hai bước duyệt:",
      items: [
        {
          text: "Trưởng bộ phận đề xuất duyệt nhu cầu và số lượng.",
          citeNum: 1,
        },
        {
          text: "Kế toán trưởng duyệt ngân sách trước khi chuyển kho.",
          citeNum: 1,
        },
        {
          text: "Người tạo yêu cầu không được tự duyệt yêu cầu của chính mình.",
          citeNum: 2,
        },
      ],
      answer:
        "Với ứng dụng Mua sắm – Kho, yêu cầu mua có tổng giá trị trên 50.000.000 đ cần qua hai bước duyệt:\n1. Trưởng bộ phận đề xuất duyệt nhu cầu và số lượng. [1]\n2. Kế toán trưởng duyệt ngân sách trước khi chuyển kho. [1]\n3. Người tạo yêu cầu không được tự duyệt yêu cầu của chính mình. [2]",
      citations: [
        {
          sourceId: "src-1",
          number: 1,
          title: "Quy chế mua sắm nội bộ",
          location: "mục 4.2",
          snippet:
            "Mục 4.2: Yêu cầu trên 50.000.000 đ do trưởng bộ phận và kế toán trưởng lần lượt duyệt. (Nội dung MẪU THỬ)",
        },
        {
          sourceId: "src-2",
          number: 2,
          title: "Cấu hình ứng dụng",
          location: "bản v1.2",
        },
      ],
    };
  }

  // Các câu hỏi khác ngoài dữ liệu mẫu trả về no_evidence
  return { status: "no_evidence" };
}
