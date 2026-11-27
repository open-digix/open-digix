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

"use client";

import React, { useState } from "react";
import type { NormalizedComponent, DataSource } from "@/lib/app-runtime/types";

export interface FormComponentProps {
  component: NormalizedComponent;
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export default function FormComponent({
  component,
  dataSource,
  onActionCompleted,
}: FormComponentProps) {
  const { resource, action = "create", label } = component;
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const ACTION_TITLES: Record<string, string> = {
    "requests:create": "Tạo yêu cầu mua",
    "requests:submit": "Gửi yêu cầu mua",
    "materials:create": "Thêm vật tư mới",
    "customers:create": "Thêm khách hàng",
    "opportunities:create": "Tạo cơ hội bán hàng",
    "receipts:receive": "Nhập kho vật tư",
  };
  const actionKey = `${resource}:${action}`;
  const displayTitle = label || ACTION_TITLES[actionKey] || "Biểu mẫu";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await dataSource.submit(resource, action, formData);
      if (res.success) {
        setFeedback(res.message || "Đã lưu bản ghi thành công.");
        setFormData({});
        onActionCompleted?.();
      } else {
        setFeedback(res.message || "Lỗi khi lưu bản ghi.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định khi lưu.";
      setFeedback(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="panel"
      style={{ padding: 20 }}
      data-testid={`form-${component.id}`}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          {displayTitle}
        </h4>
      </div>

      {feedback && (
        <div
          role="alert"
          className="info-banner"
          style={{ marginBottom: 16 }}
        >
          {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {resource === "requests" && (
          <>
            <div>
              <label htmlFor="req-title" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                Tiêu đề yêu cầu mua
              </label>
              <input
                id="req-title"
                type="text"
                name="title"
                required
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="Ví dụ: Mua vật tư đợt 2 DA..."
                className="input"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label htmlFor="req-requester" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                  Người đề xuất
                </label>
                <input
                  id="req-requester"
                  type="text"
                  name="requester"
                  required
                  value={formData.requester || ""}
                  onChange={handleChange}
                  placeholder="Họ và tên..."
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="req-total" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                  Dự toán ước tính (VNĐ)
                </label>
                <input
                  id="req-total"
                  type="number"
                  name="totalEstimated"
                  value={formData.totalEstimated || ""}
                  onChange={handleChange}
                  placeholder="Ví dụ: 25000000"
                  className="input"
                />
              </div>
            </div>
          </>
        )}

        {resource === "customers" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label htmlFor="cust-code" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                  Mã khách hàng
                </label>
                <input
                  id="cust-code"
                  type="text"
                  name="code"
                  required
                  value={formData.code || ""}
                  onChange={handleChange}
                  placeholder="KH-..."
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="cust-name" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                  Tên doanh nghiệp
                </label>
                <input
                  id="cust-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="Tên công ty/khách hàng..."
                  className="input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cust-industry" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                Lĩnh vực / Ngành nghề
              </label>
              <input
                id="cust-industry"
                type="text"
                name="industry"
                value={formData.industry || ""}
                onChange={handleChange}
                placeholder="Xây dựng, Bất động sản..."
                className="input"
              />
            </div>
          </>
        )}

        {resource === "opportunities" && (
          <>
            <div>
              <label htmlFor="opp-title" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                Tiêu đề cơ hội
              </label>
              <input
                id="opp-title"
                type="text"
                name="title"
                required
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="Ví dụ: Cung cấp vật tư hoàn thiện DA..."
                className="input"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label htmlFor="opp-cust" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                  Tên khách hàng
                </label>
                <input
                  id="opp-cust"
                  type="text"
                  name="customerName"
                  required
                  value={formData.customerName || ""}
                  onChange={handleChange}
                  placeholder="Tên khách hàng..."
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="opp-val" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
                  Giá trị dự kiến (VNĐ)
                </label>
                <input
                  id="opp-val"
                  type="number"
                  name="value"
                  value={formData.value || ""}
                  onChange={handleChange}
                  placeholder="100000000"
                  className="input"
                />
              </div>
            </div>
          </>
        )}

        {resource !== "requests" && resource !== "customers" && resource !== "opportunities" && (
          <div>
            <label htmlFor="misc-name" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ws-muted)", marginBottom: 4 }}>
              Thông tin bản ghi ({resource})
            </label>
            <input
              id="misc-name"
              type="text"
              name="name"
              required
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Nhập thông tin..."
              className="input"
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button primary"
          >
            {isSubmitting ? "Đang gửi..." : "Lưu dữ liệu"}
          </button>
        </div>
      </form>
    </div>
  );
}
