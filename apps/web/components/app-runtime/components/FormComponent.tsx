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

  const displayTitle = label || `Nhập liệu: ${resource} (${action})`;

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
      className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
      data-testid={`form-${component.id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {displayTitle}
        </h4>
        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
          {resource}:{action}
        </span>
      </div>

      {feedback && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
        >
          {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {resource === "requests" && (
          <>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tiêu đề yêu cầu mua
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="Ví dụ: Mua vật tư đợt 2 DA..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Người đề xuất
                </label>
                <input
                  type="text"
                  name="requester"
                  required
                  value={formData.requester || ""}
                  onChange={handleChange}
                  placeholder="Họ và tên..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Dự toán ước tính (VNĐ)
                </label>
                <input
                  type="number"
                  name="totalEstimated"
                  value={formData.totalEstimated || ""}
                  onChange={handleChange}
                  placeholder="Ví dụ: 25000000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        )}

        {resource === "customers" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Mã khách hàng
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code || ""}
                  onChange={handleChange}
                  placeholder="KH-..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tên doanh nghiệp
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="Tên công ty/khách hàng..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Lĩnh vực / Ngành nghề
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry || ""}
                onChange={handleChange}
                placeholder="Xây dựng, Bất động sản..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {resource === "opportunities" && (
          <>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tiêu đề cơ hội
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="Ví dụ: Cung cấp vật tư hoàn thiện DA..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tên khách hàng
                </label>
                <input
                  type="text"
                  name="customerName"
                  required
                  value={formData.customerName || ""}
                  onChange={handleChange}
                  placeholder="Tên khách hàng..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Giá trị dự kiến (VNĐ)
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value || ""}
                  onChange={handleChange}
                  placeholder="100000000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        )}

        {resource !== "requests" && resource !== "customers" && resource !== "opportunities" && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Thông tin bản ghi ({resource})
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Nhập thông tin..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting ? "Đang gửi..." : "Lưu dữ liệu"}
          </button>
        </div>
      </form>
    </div>
  );
}
