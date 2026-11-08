import Link from "next/link";

// Dữ liệu mẫu để thiết kế giao diện, chưa lấy từ API.
const summary = {
  total: 12,
  submitted: 4,
  approved: 2,
  openTasks: 4,
};

const recentRequests = [
  {
    id: "1",
    title: "Mua máy tính cho nhân viên",
    status: "Đang chờ duyệt",
    date: "07/11/2026",
  },
  {
    id: "2",
    title: "Mua bàn làm việc",
    status: "Bản nháp",
    date: "06/11/2026",
  },
  {
    id: "3",
    title: "Mua văn phòng phẩm",
    status: "Đã duyệt",
    date: "05/11/2026",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Thanh trên cùng */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-700">
            DigiX
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">Doanh nghiệp mẫu</span>
            <span className="font-medium">Tú</span>
            <Link href="/login" className="text-blue-700 underline">
              Về trang đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Tiêu đề */}
        <div>
          <p className="text-sm font-medium text-blue-700">Tổng quan</p>
          <h1 className="mt-2 text-3xl font-bold">Xin chào, Tú</h1>
          <p className="mt-2 text-slate-600">
            Theo dõi yêu cầu và công việc của bạn tại đây.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Dữ liệu trên trang hiện là dữ liệu mẫu.
          </p>
        </div>

        {/* Các ô số liệu */}
        <section aria-label="Tổng quan yêu cầu" className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">Tổng yêu cầu</p>
              <p className="mt-3 text-3xl font-bold"></p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">Đã gửi</p>
              <p className="mt-3 text-3xl font-bold"></p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">Đã duyệt</p>
              <p className="mt-3 text-3xl font-bold"></p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">Việc cần xử lý</p>
              <p className="mt-3 text-3xl font-bold"></p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}