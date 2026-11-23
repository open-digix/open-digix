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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppAction } from "../../lib/builder/actions";
import { saveStoredBuilderApp } from "../../lib/builder/storage";

interface CreateAppFormProps {
  tenantId: string;
}

export function generateAppKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export default function CreateAppForm({ tenantId }: CreateAppFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [appKey, setAppKey] = useState("");
  const [departments, setDepartments] = useState("");
  const [goal, setGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed && !/^[a-z][a-z0-9_-]{1,63}$/.test(trimmed)) {
      setKeyError(
        "Mã ứng dụng phải bắt đầu bằng chữ thường, gồm chữ thường, số, '-' hoặc '_', từ 2 đến 64 ký tự.",
      );
    } else {
      setKeyError(null);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = generateAppKey(val);
    setAppKey(generated);
    validateKey(generated);
  };

  const handleKeyChange = (val: string) => {
    setAppKey(val);
    validateKey(val);
  };

  const fillSampleData = () => {
    const sampleName = "Đề nghị mua sắm";
    setName(sampleName);
    setAppKey(generateAppKey(sampleName));
    setDepartments("IT, FINANCE");
    setGoal("Quy trình đề xuất mua thiết bị và phần mềm nội bộ");
    setKeyError(null);
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setGeneralError(null);

    const trimmedKey = appKey.trim();
    if (!/^[a-z][a-z0-9_-]{1,63}$/.test(trimmedKey)) {
      setKeyError(
        "Mã ứng dụng phải bắt đầu bằng chữ thường, gồm chữ thường, số, '-' hoặc '_', từ 2 đến 64 ký tự.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAppAction({
        name,
        appKey: trimmedKey,
        goal,
        departments,
      });

      if (!res.ok) {
        if (
          res.error?.code === "APP_KEY_CONFLICT" ||
          res.error?.code === "409"
        ) {
          setKeyError("Mã ứng dụng này đã tồn tại trong doanh nghiệp. Vui lòng chọn mã khác.");
        } else {
          setGeneralError(res.error?.message || "Không thể tạo ứng dụng.");
        }
        return;
      }

      if (res.data) {
        saveStoredBuilderApp(tenantId, {
          appId: res.data.appId,
          appKey: res.data.appKey,
          name: res.data.name,
          goal: goal.trim() || undefined,
          version: res.data.version,
          createdAt: new Date().toLocaleDateString("vi-VN"),
        });
        router.push(`/builder/${res.data.appId}?step=source`);
      }
    } catch {
      setGeneralError("Đã xảy ra lỗi kết nối khi tạo ứng dụng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flow-grid">
      <section className="panel flow-primary">
        <div className="panel-head">
          <div>
            <h2>Thông tin ứng dụng</h2>
            <p>Khởi tạo ứng dụng mới trên API thật của Gateway</p>
          </div>
          <span className="status warning">Bản nháp v1</span>
        </div>

        <div className="panel-body">
          {generalError && (
            <div
              className="info-banner"
              style={{
                background: "var(--ws-soft)",
                borderColor: "var(--ws-danger)",
                color: "var(--ws-danger)",
                marginBottom: 16,
              }}
              role="alert"
            >
              <b>Lỗi:</b> {generalError}
            </div>
          )}

          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="button secondary"
              style={{ fontSize: 10 }}
              onClick={fillSampleData}
            >
              ✦ Điền ví dụ (MẪU THỬ)
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="flow-name">Tên ứng dụng *</label>
              <input
                id="flow-name"
                name="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={80}
                required
                autoComplete="off"
                placeholder="Ví dụ: Đề nghị mua sắm"
              />
              <small>Tên hiển thị trong không gian làm việc.</small>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="flow-key">Mã ứng dụng (appKey) *</label>
                <input
                  id="flow-key"
                  name="appKey"
                  value={appKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="vi-du-de-nghi-mua-sam"
                />
                {keyError ? (
                  <small style={{ color: "var(--ws-danger)", fontWeight: 700 }}>
                    {keyError}
                  </small>
                ) : (
                  <small>Tự sinh từ tên, chữ thường, số, dấu - hoặc _.</small>
                )}
              </div>

              <div className="field">
                <label htmlFor="flow-depts">Bộ phận</label>
                <input
                  id="flow-depts"
                  name="departments"
                  value={departments}
                  onChange={(e) => setDepartments(e.target.value)}
                  autoComplete="off"
                  placeholder="Ví dụ: IT, FINANCE"
                />
                <small>Tách nhau bằng dấu phẩy (tùy chọn).</small>
              </div>
            </div>

            <div className="field">
              <label htmlFor="flow-goal">Mục tiêu quy trình *</label>
              <textarea
                id="flow-goal"
                name="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                rows={4}
                placeholder="Mô tả mục tiêu của ứng dụng nghiệp vụ này..."
              />
            </div>

            <div className="flow-form-foot">
              <span style={{ fontSize: 11, color: "var(--ws-muted)" }}>
                Bước 1 / 5: Khởi tạo thông tin cơ bản
              </span>
              <div>
                <button
                  className="button primary"
                  type="submit"
                  disabled={isSubmitting || Boolean(keyError)}
                >
                  {isSubmitting ? "Đang tạo ứng dụng..." : "Tạo bản nháp & tiếp tục →"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <aside className="panel flow-side">
        <div className="panel-head">
          <div>
            <h2>Quy tắc tạo ứng dụng</h2>
            <p>Hợp đồng Builder API M2</p>
          </div>
        </div>
        <div className="panel-body">
          <ol className="flow-side-list">
            <li>
              <b>Định danh duy nhất</b>
              <span>Mã ứng dụng (appKey) không được trùng lặp trong doanh nghiệp.</span>
            </li>
            <li>
              <b>Khởi tạo bản nháp</b>
              <span>Sau khi tạo, hệ thống cấp version 1 và lockVersion 1 để bắt đầu thiết kế.</span>
            </li>
            <li>
              <b>Mô tả bằng văn bản</b>
              <span>Bước tiếp theo cho phép bạn nhập 7 mục mô tả tự nhiên theo cấu trúc.</span>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
