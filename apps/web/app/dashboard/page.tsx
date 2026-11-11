import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import LogoutButton from "../components/LogoutButton";

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

type MeResponse = {
  user: {
    displayName: string | null;
    email: string | null;
  };
  memberships: Array<{
    id: string;
    status: string;
    tenant: {
      id: string;
      name: string;
      status: string;
    };
    roles: string[];
  }>;
};

export default async function DashboardPage() {
  const requestHeaders = await headers();

  const token = await getToken({
    req: { headers: requestHeaders },
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.accessToken || typeof token.accessToken !== "string") {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://localhost:3001"}/v1/me`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
        cache: "no-store",
      },
    );
  } catch {
    return (
      <main style={{ padding: 32 }}>
        <h1>Không kết nối được API</h1>
        <p>Kiểm tra API đang chạy rồi tải lại trang.</p>
      </main>
    );
  }

  if (response.status === 401) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Phiên truy cập không còn hợp lệ</h1>
        <p>Vui lòng đăng nhập lại.</p>
        <a href="/login">về trang chủ</a>
      </main>
    );
  }

  if (response.status === 403) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Tài khoản chưa được cấp quyền</h1>
        <p>Vui lòng liên hệ quản trị viên để kiểm tra tài khoản và tenant.</p>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Không thể tải thông tin người dùng</h1>
        <p>Vui lòng thử lại sau.</p>
      </main>
    );
  }

  const me = (await response.json()) as MeResponse;
  const displayName = me.user.displayName || me.user.email || "bạn";

  const activeMemberships = me.memberships.filter(
    (membership) =>
      membership.status === "active" &&
      membership.tenant.status === "active",
  );

    return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Thanh trên cùng */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-700">
            DigiX
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">
              {activeMemberships.length === 1
                ? activeMemberships[0].tenant.name
                : activeMemberships.length > 1
                  ? "Cần chọn doanh nghiệp"
                  : "Chưa có doanh nghiệp"}
            </span>
            <span className="font-medium">{displayName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Tiêu đề */}
        <div>
          <p className="text-sm font-medium text-blue-700">Tổng quan</p>
          <h1 className="mt-2 text-3xl font-bold">Xin chào, {displayName}</h1>
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