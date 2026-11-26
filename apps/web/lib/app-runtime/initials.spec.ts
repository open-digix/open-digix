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
import { getAppInitials } from "./initials";

describe("getAppInitials (Mục 17, ký hiệu thẻ app)", () => {
  it("lấy chữ cái đầu của 2 từ đầu khi tên có từ 2 từ trở lên", () => {
    expect(getAppInitials("Đề nghị mua sắm")).toBe("ĐN");
    expect(getAppInitials("Khách hàng")).toBe("KH");
    expect(getAppInitials("Quản lý kho vật tư")).toBe("QL");
    expect(getAppInitials("ERP Bán hàng")).toBe("EB");
  });

  it("lấy 2 chữ đầu khi tên chỉ có 1 từ", () => {
    expect(getAppInitials("DigiX")).toBe("DI");
    expect(getAppInitials("ERP")).toBe("ER");
    expect(getAppInitials("crm")).toBe("CR");
    expect(getAppInitials("Kho")).toBe("KH");
  });

  it("xử lý tên rỗng hoặc khoảng trắng thừa", () => {
    expect(getAppInitials("")).toBe("DX");
    expect(getAppInitials("   ")).toBe("DX");
    expect(getAppInitials("  Đề   nghị  ")).toBe("ĐN");
  });
});
