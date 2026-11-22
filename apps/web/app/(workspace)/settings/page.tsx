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

import { useMockToast } from "../../../components/workspace/MockToast";

export default function SettingsPage() {
  const { showToast, ToastContainer } = useMockToast();

  const handleSave = () => {
    showToast("Đã lưu thiết lập (mẫu — không gửi tới hệ thống).");
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">QUẢN TRỊ DOANH NGHIỆP</div>
          <h1>Thiết lập không gian làm việc</h1>
          <p>Cấu hình thông tin doanh nghiệp, thành viên và phân quyền</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="button primary" onClick={handleSave}>
            Lưu thay đổi
          </button>
        </div>
      </header>

      <div className="panel" style={{ maxWidth: 800 }}>
        <div className="panel-head">
          <div>
            <h2>Quy tắc vận hành</h2>
            <p>Các chính sách áp dụng cho quy trình nội bộ</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="setting-row">
            <div>
              <strong>Nguyên tắc Không tự duyệt (No Self-Approval)</strong>
              <small>
                Người tạo hồ sơ không thể tự phê duyệt đề nghị của chính mình
              </small>
            </div>
            <span className="status">Bắt buộc bật</span>
          </div>

          <div className="setting-row">
            <div>
              <strong>Tự động lưu bản nháp</strong>
              <small>Lưu tạm tiến trình điền mẫu của người dùng trên trình duyệt</small>
            </div>
            <span className="status">Đang bật</span>
          </div>

          <div className="setting-row">
            <div>
              <strong>Thời hạn xử lý mặc định</strong>
              <small>Áp dụng khi quy trình không chỉ định SLA cụ thể</small>
            </div>
            <strong>48 giờ làm việc</strong>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
