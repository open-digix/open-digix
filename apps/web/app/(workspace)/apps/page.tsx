import { Suspense } from "react";
import type { Metadata } from "next";
import AppsView from "./AppsView";

export const metadata: Metadata = {
  title: "Ứng dụng · DigiX",
};

export default function AppsPage() {
  return (
    <Suspense
      fallback={
        <div className="page apps-page">
          <div className="panel empty-state">
            <p>Đang tải danh sách ứng dụng...</p>
          </div>
        </div>
      }
    >
      <AppsView />
    </Suspense>
  );
}
