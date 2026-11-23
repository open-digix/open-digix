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

import "./workspace.css";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  getServerAccessToken,
  getMeCached,
  getTenantContext,
} from "../../lib/api/server";
import AppShell from "../../components/workspace/AppShell";

export async function WorkspaceLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const token = await getServerAccessToken();
  if (!token) {
    redirect("/login");
  }

  const meResult = await getMeCached();
  if (!meResult.ok) {
    if (meResult.kind === "unauthenticated") {
      return (
        <div
          className="ws-root"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "var(--ws-canvas)",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 460,
              width: "100%",
              textAlign: "center",
              padding: 32,
            }}
          >
            <div
              className="info-banner"
              style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
              role="alert"
            >
              <b>Phiên đăng nhập đã hết hạn</b>
            </div>
            <p
              style={{
                color: "var(--ws-muted)",
                marginBottom: 24,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Phiên làm việc của bạn không còn hợp lệ hoặc đã hết hạn. Vui lòng
              đăng nhập lại.
            </p>
            <a href="/login" className="button primary">
              Đăng nhập lại
            </a>
          </div>
        </div>
      );
    }

    if (meResult.kind === "forbidden") {
      return (
        <div
          className="ws-root"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "var(--ws-canvas)",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 460,
              width: "100%",
              textAlign: "center",
              padding: 32,
            }}
          >
            <div
              className="info-banner"
              style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
              role="alert"
            >
              <b>Tài khoản chưa được cấp quyền vào doanh nghiệp nào</b>
            </div>
            <p
              style={{
                color: "var(--ws-muted)",
                marginBottom: 24,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Vui lòng liên hệ với quản trị viên doanh nghiệp để được phân quyền
              trước khi truy cập.
            </p>
            <a href="/login" className="button secondary">
              Đăng nhập lại
            </a>
          </div>
        </div>
      );
    }

    return (
      <div
        className="ws-root"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--ws-canvas)",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 460,
            width: "100%",
            textAlign: "center",
            padding: 32,
          }}
        >
          <div
            className="info-banner"
            style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
            role="alert"
          >
            <b>Không kết nối được hệ thống</b>
          </div>
          <p
            style={{
              color: "var(--ws-muted)",
              marginBottom: 24,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Không thể tải dữ liệu người dùng từ hệ thống backend. Vui lòng kiểm
            tra lại dịch vụ và thử lại.
          </p>
          <a href="/dashboard" className="button primary">
            Thử lại
          </a>
        </div>
      </div>
    );
  }

  const context = await getTenantContext();
  if (!context) {
    redirect("/login");
  }

  const {
    me,
    activeMemberships,
    currentTenant,
    roles,
    needsTenantSelection,
  } = context;

  return (
    <AppShell
      user={me.user}
      activeMemberships={activeMemberships}
      currentTenantId={currentTenant?.id ?? null}
      roles={roles}
    >
      {needsTenantSelection ? (
        <div className="page">
          <div className="info-banner" role="alert">
            <div>
              <b>Yêu cầu chọn doanh nghiệp</b>
              <p style={{ margin: "4px 0 0" }}>
                Tài khoản của bạn thuộc nhiều doanh nghiệp. Vui lòng chọn một doanh nghiệp ở thanh trên cùng để tiếp tục làm việc.
              </p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="ws-root"
          style={{ minHeight: "100vh", background: "var(--ws-canvas)" }}
        />
      }
    >
      <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
    </Suspense>
  );
}
