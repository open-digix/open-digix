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

import { Suspense } from "react";
import type { Metadata } from "next";
import LoginErrorView from "./LoginErrorView";
import EnforceLightMode from "@/components/common/EnforceLightMode";

export const metadata: Metadata = {
  title: "Lỗi đăng nhập · DigiX",
  description: "Trang thông báo lỗi xác thực và hỗ trợ đăng nhập DigiX.",
};

export default function LoginErrorPage() {
  return (
    <div data-theme="light">
      <EnforceLightMode />
      <Suspense
      fallback={
        <div className="landing-page" style={{ minHeight: "100vh" }}>
          <main>
            <section
              className="landing-hero"
              style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div className="landing-auth-dialog landing-auth-error-card">
                <p className="landing-auth-label">XÁC THỰC TÀI KHOẢN</p>
                <h2>Đang tải...</h2>
              </div>
            </section>
          </main>
        </div>
      }
    >
      <LoginErrorView />
    </Suspense>
    </div>
  );
}
