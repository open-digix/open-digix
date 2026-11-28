"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { listAppsAction } from "@/lib/app-config/actions";
import type { AppSummary } from "@/lib/app-config/types";
import { useMockToast } from "@/components/workspace/MockToast";
import { getAppInitials } from "@/lib/app-runtime/initials";

export default function AppsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: "all" | "published" | "draft" =
    tabParam === "draft" || tabParam === "drafts"
      ? "draft"
      : tabParam === "published"
        ? tabParam
        : "all";

  const [apps, setApps] = useState<AppSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { ToastContainer } = useMockToast();

  useEffect(() => {
    document.title =
      tab === "draft" ? "Thiết kế ứng dụng · DigiX" : "Ứng dụng · DigiX";
  }, [tab]);

  useEffect(() => {
    let isMounted = true;
    listAppsAction()
      .then((data) => {
        if (!isMounted) return;
        setApps(data);
      })
      .catch((err) => {
        console.error("Lỗi tải ứng dụng:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setTabAndUrl = (newTab: "all" | "published" | "draft") => {
    if (newTab === "all") {
      router.replace("/apps");
    } else if (newTab === "draft") {
      router.replace("/apps?tab=drafts");
    } else {
      router.replace(`/apps?tab=${newTab}`);
    }
  };

  const filteredApps = apps.filter((app) => {
    if (tab === "published" && app.status !== "published") return false;
    if (tab === "draft" && app.status !== "draft") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.appKey.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page apps-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            {tab === "draft" ? "THIẾT KẾ ỨNG DỤNG" : "KHÔNG GIAN LÀM VIỆC"}
          </div>
          <h1>
            {tab === "draft" ? "Thiết kế ứng dụng" : "Ứng dụng doanh nghiệp"}
          </h1>
          <p>
            {tab === "draft"
              ? "Tùy chỉnh và tạo cấu hình cho các ứng dụng composable trong tổ chức."
              : "Chọn ứng dụng để làm việc hoặc theo dõi tiến trình thực hiện."}
          </p>
        </div>
        {tab === "draft" && (
          <div className="page-header-actions">
            <Link href="/builder/new" className="button primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tạo ứng dụng mới</span>
            </Link>
          </div>
        )}
      </header>

      <div
        className="app-filter-tabs"
        role="tablist"
        aria-label="Bộ lọc trạng thái ứng dụng"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "all"}
          className={`app-filter-tab ${tab === "all" ? "active" : ""}`}
          onClick={() => setTabAndUrl("all")}
        >
          Tất cả ({apps.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "published"}
          className={`app-filter-tab ${tab === "published" ? "active" : ""}`}
          onClick={() => setTabAndUrl("published")}
        >
          Đang dùng ({apps.filter((a) => a.status === "published").length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "draft"}
          className={`app-filter-tab ${tab === "draft" ? "active" : ""}`}
          onClick={() => setTabAndUrl("draft")}
        >
          Bản nháp ({apps.filter((a) => a.status === "draft").length})
        </button>
      </div>

      <div className="app-search-bar">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã ứng dụng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input search-input"
        />
      </div>

      {loading ? (
        <div className="panel empty-state">
          <p>Đang tải danh sách ứng dụng...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="panel empty-state">
          <p>Không tìm thấy ứng dụng nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="app-grid">
          {filteredApps.map((app) => (
            <div key={app.appId} className="panel app-card">
              <div className="app-card-head">
                <span className="app-icon">{getAppInitials(app.name)}</span>
                <span
                  className={`app-badge ${app.status === "published" ? "published" : "draft"}`}
                >
                  {app.status === "published" ? "Đang dùng" : "Bản nháp"}
                </span>
              </div>
              <h3>{app.name}</h3>
              <p>{`Ứng dụng quy trình ${app.name}`}</p>
              <div className="app-card-foot">
                <span>v{app.version}</span>
                {app.status === "published" ? (
                  <Link href={`/app/${app.appId}`} className="button secondary">
                    Mở ứng dụng →
                  </Link>
                ) : (
                  <Link href={`/builder/${app.appId}`} className="button secondary">
                    Chỉnh sửa →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
