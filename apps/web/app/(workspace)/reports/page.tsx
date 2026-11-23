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

export default function ReportsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">BÁO CÁO VẬN HÀNH</div>
          <h1>Báo cáo & Thống kê</h1>
          <p>Hiệu suất xử lý quy trình và hồ sơ trong doanh nghiệp</p>
        </div>
      </header>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Phân bố hồ sơ theo trạng thái</h2>
              <p>Dữ liệu mẫu mô phỏng tháng 11/2026</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="report-bars">
              <div className="report-bar">
                <span>Đã duyệt</span>
                <div className="bar-track">
                  <i style={{ width: "70%" }} />
                </div>
                <b>70%</b>
              </div>
              <div className="report-bar">
                <span>Chờ xử lý</span>
                <div className="bar-track">
                  <i style={{ width: "20%" }} />
                </div>
                <b>20%</b>
              </div>
              <div className="report-bar">
                <span>Từ chối</span>
                <div className="bar-track">
                  <i style={{ width: "10%" }} />
                </div>
                <b>10%</b>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Nhận định vận hành</h2>
              <p>Phân tích tự động (mẫu)</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="insight">
              <div>
                <strong>Thời gian xử lý trung bình: 1.4 ngày</strong>
                <p>Nhanh hơn 18% so với chu kỳ trước nhờ quy trình tinh gọn.</p>
              </div>
            </div>
            <div className="insight" style={{ marginTop: 10 }}>
              <div>
                <strong>Quy trình dùng nhiều nhất</strong>
                <p>Đề nghị mua sắm chiếm 62% tổng số yêu cầu nội bộ.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
