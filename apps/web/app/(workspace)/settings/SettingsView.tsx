"use client";

export default function SettingsView() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">QUẢN TRỊ DOANH NGHIỆP</div>
          <h1>Thiết lập không gian làm việc</h1>
          <p>Xem các chính sách và quy tắc vận hành áp dụng cho quy trình nội bộ</p>
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
    </div>
  );
}
