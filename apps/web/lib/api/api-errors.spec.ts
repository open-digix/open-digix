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

import { describe, it, expect } from "vitest";
import { determineErrorKind } from "./errors";
import { ApiError } from "./server";

describe("API Error Standardization (v2.5 §3)", () => {
  it("maps status codes to correct ApiErrorKind", () => {
    expect(determineErrorKind(401)).toBe("unauthenticated");
    expect(determineErrorKind(403)).toBe("forbidden");
    expect(determineErrorKind(404)).toBe("not_found");
    expect(determineErrorKind(409)).toBe("conflict");
    expect(determineErrorKind(422)).toBe("unprocessable");
    expect(determineErrorKind(429)).toBe("rate_limited");
    expect(determineErrorKind(500)).toBe("unavailable");
    expect(determineErrorKind(502)).toBe("unavailable");
    expect(determineErrorKind(503)).toBe("unavailable");
  });

  it("ApiError class automatically infers kind from status", () => {
    const err404 = new ApiError(404, "NOT_FOUND", "Không tìm thấy");
    expect(err404.status).toBe(404);
    expect(err404.code).toBe("NOT_FOUND");
    expect(err404.kind).toBe("not_found");

    const err409 = new ApiError(409, "VERSION_CONFLICT", "Xung đột phiên bản");
    expect(err409.kind).toBe("conflict");

    const err422 = new ApiError(
      422,
      "VALIDATION_FAILED",
      "Dữ liệu không hợp lệ",
      undefined,
      [{ code: "REQUIRED", path: "/name", message: "Bắt buộc nhập tên" }],
    );
    expect(err422.kind).toBe("unprocessable");
    expect(err422.issues).toHaveLength(1);
    expect(err422.issues?.[0].path).toBe("/name");
  });

  it("allows explicit override of kind", () => {
    const customErr = new ApiError(
      400,
      "BAD_REQUEST",
      "Lỗi mạng",
      undefined,
      undefined,
      "unavailable",
    );
    expect(customErr.kind).toBe("unavailable");
  });
});
