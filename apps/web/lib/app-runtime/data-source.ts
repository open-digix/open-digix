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

import type { DataSource, DataSourceQuery, DataSourceListResult } from "./types";

interface SyntheticRecord {
  id: string;
  [key: string]: unknown;
}

export function encodeCursor(offset: number): string {
  if (typeof btoa === "function") {
    return btoa(`offset:${offset}`);
  }
  return Buffer.from(`offset:${offset}`).toString("base64");
}

export function decodeCursor(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const raw = typeof atob === "function" ? atob(cursor) : Buffer.from(cursor, "base64").toString("utf-8");
    if (raw.startsWith("offset:")) {
      const parsed = parseInt(raw.slice(7), 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  } catch {
    return 0;
  }
  return 0;
}

export class MockDataSource implements DataSource {
  public readonly isMock = true;
  private data: Record<string, SyntheticRecord[]> = {};

  constructor() {
    this.resetData();
  }

  public resetData() {
    this.data = {
      materials: [
        { id: "VT-001", code: "THEP-H150", name: "Thép hình H150x150", unit: "Cây", stock: 120, unitPrice: 3250000, category: "Sắt thép" },
        { id: "VT-002", code: "XM-HOLCIM", name: "Xi măng Holcim đa dụng", unit: "Bao 50kg", stock: 450, unitPrice: 92000, category: "Vật liệu thô" },
        { id: "VT-003", code: "ONG-PVC-90", name: "Ống nhựa PVC D90 Bình Minh", unit: "Cây 4m", stock: 80, unitPrice: 185000, category: "Cấp thoát nước" },
        { id: "VT-004", code: "SON-MAXILITE", name: "Sơn ngoại thất Maxilite", unit: "Thùng 18L", stock: 35, unitPrice: 1200000, category: "Sơn hoàn thiện" },
        { id: "VT-005", code: "CAT-XAY-TO", name: "Cát xây tô sàng lọc", unit: "m³", stock: 200, unitPrice: 280000, category: "Vật liệu thô" },
        { id: "VT-006", code: "GACH-4LO", name: "Gạch Tuynel 4 lỗ 8x8x18", unit: "Viên", stock: 15000, unitPrice: 1350, category: "Gạch ngói" },
      ],
      requests: [
        { id: "PR-2026-001", title: "Mua thép hình đợt 1 DA Nam Long", requester: "Nguyễn Văn Hùng", date: "2026-11-20", status: "pending", totalEstimated: 39000000 },
        { id: "PR-2026-002", title: "Bổ sung xi măng đổ sàn tầng 3", requester: "Trần Anh Khoa", date: "2026-11-22", status: "approved", totalEstimated: 41400000 },
        { id: "PR-2026-003", title: "Mua phụ kiện ống nước tòa B", requester: "Phạm Minh Tuấn", date: "2026-11-24", status: "pending", totalEstimated: 14800000 },
        { id: "PR-2026-004", title: "Sơn nước đợt hoàn thiện", requester: "Lê Hoàng Yến", date: "2026-11-25", status: "rejected", totalEstimated: 42000000 },
        { id: "PR-2026-005", title: "Cát xây tô hoàn thiện tháp C", requester: "Đỗ Gia Bảo", date: "2026-11-26", status: "pending", totalEstimated: 56000000 },
      ],
      stock: [
        { id: "STK-01", warehouse: "Kho Tổng Tân Bình", materialId: "VT-001", materialName: "Thép hình H150x150", quantity: 80, reserved: 20 },
        { id: "STK-02", warehouse: "Kho Cảng Cát Lái", materialId: "VT-001", materialName: "Thép hình H150x150", quantity: 40, reserved: 0 },
        { id: "STK-03", warehouse: "Kho Tổng Tân Bình", materialId: "VT-002", materialName: "Xi măng Holcim", quantity: 300, reserved: 50 },
        { id: "STK-04", warehouse: "Kho Dự Án Q9", materialId: "VT-002", materialName: "Xi măng Holcim", quantity: 150, reserved: 0 },
        { id: "STK-05", warehouse: "Kho Tổng Tân Bình", materialId: "VT-003", materialName: "Ống nhựa PVC D90", quantity: 80, reserved: 15 },
      ],
      receipts: [
        { id: "RC-101", invoiceNumber: "HD-8842", supplier: "Công ty TNHH Thép Việt", receivedAt: "2026-11-18", status: "completed" },
        { id: "RC-102", invoiceNumber: "HD-9120", supplier: "Xi măng Holcim VN", receivedAt: "2026-11-21", status: "completed" },
        { id: "RC-103", invoiceNumber: "HD-9501", supplier: "Nhựa Bình Minh", receivedAt: "2026-11-23", status: "draft" },
      ],
      customers: [
        { id: "KH-001", code: "HOAPHAT", name: "Tập đoàn Hòa Phát", industry: "Sản xuất & Bất động sản", contactPerson: "Trần Đình Long", phone: "024.3984.xxxx", status: "active" },
        { id: "KH-002", code: "NAMLONG", name: "Công ty Cổ phần Đầu tư Nam Long", industry: "Bất động sản dân dụng", contactPerson: "Nguyễn Xuân Quang", phone: "028.5416.xxxx", status: "active" },
        { id: "KH-003", code: "DATXANH", name: "Đất Xanh Group", industry: "Xây dựng & Môi giới", contactPerson: "Lương Trí Thìn", phone: "028.6258.xxxx", status: "active" },
        { id: "KH-004", code: "VINACONEX", name: "Tổng công ty CP VINACONEX", industry: "Hạ tầng giao thông", contactPerson: "Đào Ngọc Thanh", phone: "024.6284.xxxx", status: "lead" },
        { id: "KH-005", code: "COTECCONS", name: "Coteccons Construction", industry: "Tổng thầu thi công", contactPerson: "Bolat Duisenov", phone: "028.3514.xxxx", status: "active" },
      ],
      contacts: [
        { id: "CT-01", name: "Nguyễn Văn An", customerId: "KH-001", role: "Trưởng phòng Mua hàng", email: "an.nv@hoaphat.example.com", phone: "0903.111.xxx" },
        { id: "CT-02", name: "Lê Thị Bích", customerId: "KH-002", role: "Giám đốc Dự án", email: "bich.le@namlong.example.com", phone: "0918.222.xxx" },
        { id: "CT-03", name: "Võ Quang Huy", customerId: "KH-003", role: "Chuyên viên Đấu thầu", email: "huy.vq@datxanh.example.com", phone: "0982.333.xxx" },
      ],
      opportunities: [
        { id: "OPP-001", title: "Cung cấp VLXD Giai đoạn 2 DA Akari City", customerName: "Nam Long", stage: "negotiation", value: 450000000, probability: 75 },
        { id: "OPP-002", title: "Hợp đồng khung thép kết cấu 2027", customerName: "Hòa Phát", stage: "proposal", value: 1200000000, probability: 60 },
        { id: "OPP-003", title: "Vật tư hoàn thiện tháp Aqua 1", customerName: "Đất Xanh", stage: "closed_won", value: 380000000, probability: 100 },
        { id: "OPP-004", title: "Gói thầu cơ điện MEP gói 5", customerName: "Coteccons", stage: "qualification", value: 290000000, probability: 40 },
        { id: "OPP-005", title: "Cung cấp ống và phụ kiện thoát nước DA Meyhomes", customerName: "VINACONEX", stage: "lead", value: 150000000, probability: 20 },
      ],
    };
  }

  public async list(resource: string, query?: DataSourceQuery): Promise<DataSourceListResult> {
    const list = this.data[resource] || [];
    const limit = Math.min(Math.max(query?.limit ?? 20, 1), 100);
    const offset = decodeCursor(query?.cursor);

    const items = list.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < list.length ? encodeCursor(nextOffset) : undefined;

    return {
      items,
      nextCursor,
    };
  }

  public async get(resource: string, id: string): Promise<Record<string, unknown> | null> {
    const list = this.data[resource] || [];
    const item = list.find((it) => it.id === id);
    return item ? { ...item } : null;
  }

  public async submit(
    resource: string,
    action: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; id?: string; message?: string }> {
    if (!this.data[resource]) {
      this.data[resource] = [];
    }

    const prefix = resource.slice(0, 3).toUpperCase();
    const id = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: SyntheticRecord = {
      id,
      ...payload,
      createdAt: new Date().toISOString(),
      status: payload.status || "pending",
    };

    // Đưa lên đầu danh sách để người dùng thấy ngay
    this.data[resource].unshift(newRecord);

    return {
      success: true,
      id,
      message: `Tạo bản ghi mới thành công trong ${resource} (${id})`,
    };
  }

  public async runAction(
    resource: string,
    action: string,
    payload?: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }> {
    const list = this.data[resource] || [];
    const targetId = payload?.id as string | undefined;

    if (targetId) {
      const record = list.find((r) => r.id === targetId);
      if (record) {
        if (action === "approve") {
          record.status = "approved";
          return { success: true, message: `Yêu cầu ${targetId} đã được phê duyệt thành công.` };
        }
        if (action === "reject") {
          record.status = "rejected";
          return { success: true, message: `Yêu cầu ${targetId} đã bị từ chối.` };
        }
        if (action === "advance") {
          const stages = ["lead", "qualification", "proposal", "negotiation", "closed_won"];
          const currentIdx = stages.indexOf(String(record.stage));
          if (currentIdx >= 0 && currentIdx < stages.length - 1) {
            record.stage = stages[currentIdx + 1];
          } else {
            record.stage = "closed_won";
          }
          return { success: true, message: `Cơ hội ${targetId} đã chuyển sang bước "${record.stage}".` };
        }
      }
    }

    // Nếu không có id cụ thể hoặc action cấp resource (ví dụ: approve_first)
    if (action === "approve") {
      const firstPending = list.find((r) => r.status === "pending");
      if (firstPending) {
        firstPending.status = "approved";
        return { success: true, message: `Đã phê duyệt yêu cầu chờ duyệt đầu tiên (${firstPending.id}) thành công.` };
      }
      return { success: true, message: "Không có yêu cầu nào đang chờ duyệt." };
    }

    if (action === "advance") {
      const firstLead = list.find((r) => r.stage !== "closed_won");
      if (firstLead) {
        firstLead.stage = "closed_won";
        return { success: true, message: `Đã đẩy tiến độ cơ hội ${firstLead.id} thành công.` };
      }
    }

    return {
      success: true,
      message: `Đã thực thi hành động "${action}" trên "${resource}" thành công (Mô phỏng).`,
    };
  }
}
