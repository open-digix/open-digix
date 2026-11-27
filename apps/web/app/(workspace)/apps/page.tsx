import { Suspense } from "react";
import type { Metadata } from "next";
import AppsView from "./AppsView";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const isDraft = params?.tab === "draft" || params?.tab === "drafts";
  return {
    title: isDraft ? "Thiết kế ứng dụng · DigiX" : "Ứng dụng · DigiX",
  };
}

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
