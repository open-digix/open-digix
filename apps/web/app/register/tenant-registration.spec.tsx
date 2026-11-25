import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChoiceView from "./ChoiceView";
import TenantRegistrationForm from "./TenantRegistrationForm";

describe("Tenant Registration UI (UI-03)", () => {
  describe("ChoiceView", () => {
    it("renders both registration choices", () => {
      const onSelectTenant = vi.fn();
      const onSelectJoin = vi.fn();

      render(
        <ChoiceView onSelectTenant={onSelectTenant} onSelectJoin={onSelectJoin} />
      );

      expect(screen.getByRole("heading", { name: "Bắt đầu cùng DigiX" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Tạo doanh nghiệp mới/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Tham gia doanh nghiệp có sẵn/i })).toBeInTheDocument();
    });

    it("fires callbacks when cards are clicked", () => {
      const onSelectTenant = vi.fn();
      const onSelectJoin = vi.fn();

      render(
        <ChoiceView onSelectTenant={onSelectTenant} onSelectJoin={onSelectJoin} />
      );

      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp mới/i }));
      expect(onSelectTenant).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /Tham gia doanh nghiệp có sẵn/i }));
      expect(onSelectJoin).toHaveBeenCalledTimes(1);
    });
  });

  describe("TenantRegistrationForm", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, REGISTRATION_API_MODE: "mock" };
    });

    afterEach(() => {
      process.env = originalEnv;
      vi.restoreAllMocks();
    });

    it("validates empty step 1 inputs", () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      expect(screen.getByRole("heading", { name: "Tạo doanh nghiệp mới" })).toBeInTheDocument();
      expect(screen.getByLabelText("Tên doanh nghiệp")).toBeInTheDocument();
      expect(screen.getByLabelText("Mã doanh nghiệp")).toBeInTheDocument();

      const nextBtn = screen.getByRole("button", { name: /Tiếp tục/i });
      fireEvent.click(nextBtn);

      expect(screen.getByText("Vui lòng nhập tên doanh nghiệp.")).toBeInTheDocument();
    });

    it("auto-generates slug and transitions to step 2, allows back button preserving state", () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      const nameInput = screen.getByLabelText("Tên doanh nghiệp");
      const slugInput = screen.getByLabelText("Mã doanh nghiệp");

      fireEvent.change(nameInput, { target: { value: "Công ty Cổ phần Đông Á" } });
      expect((slugInput as HTMLInputElement).value).toBe("cong-ty-co-phan-dong-a");

      // Advance to step 2
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      expect(screen.getByRole("heading", { name: "Tài khoản quản trị" })).toBeInTheDocument();
      expect(screen.getByText("Công ty Cổ phần Đông Á")).toBeInTheDocument();

      // Click back
      fireEvent.click(screen.getByRole("button", { name: /Quay lại/i }));

      expect(screen.getByRole("heading", { name: "Tạo doanh nghiệp mới" })).toBeInTheDocument();
      expect((screen.getByLabelText("Tên doanh nghiệp") as HTMLInputElement).value).toBe("Công ty Cổ phần Đông Á");
      expect((screen.getByLabelText("Mã doanh nghiệp") as HTMLInputElement).value).toBe("cong-ty-co-phan-dong-a");
    });

    it("validates password length and complexity rules (A1! blocked, abcdefgh blocked, Abcdefg1 accepted)", () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), {
        target: { value: "Đông Á Corp" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Fill basic fields
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an@example.com" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "an.nguyen" } });
      fireEvent.click(screen.getByRole("checkbox"));

      // 1. Password A1! (less than 8 chars)
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "A1!" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "A1!" } });
      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));
      expect(screen.getByText("Mật khẩu phải có ít nhất 8 ký tự.")).toBeInTheDocument();

      // 2. Password abcdefgh (8 chars but 0 of 3 extra rules)
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "abcdefgh" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "abcdefgh" } });
      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));
      expect(
        screen.getByText("Mật khẩu phải thỏa mãn ít nhất 2 trong 3 yêu cầu: chữ hoa, chữ số, ký tự đặc biệt."),
      ).toBeInTheDocument();

      // 3. Password Abcdefg1 (8 chars, uppercase + digit = 2 of 3 extra rules)
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Abcdefg1" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "Abcdefg1" } });
      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));
      expect(screen.queryByText(/Mật khẩu phải/i)).not.toBeInTheDocument();
    });

    it("validates username starting with a letter and length 3-64 (1abc rejected)", () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), { target: { value: "Đông Á Corp" } });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Fill valid fields but username starts with 1
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an@example.com" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "1abc" } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.click(screen.getByRole("checkbox"));

      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      expect(
        screen.getByText("Tên đăng nhập dài 3–64 ký tự, bắt đầu bằng chữ cái, chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang."),
      ).toBeInTheDocument();
    });

    it("handles VALIDATION_FAILED issues correctly and displays Vietnamese error instead of server English", async () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      // Step 1: use "mock-validation-issues"
      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), { target: { value: "Công ty Test" } });
      fireEvent.change(screen.getByLabelText("Mã doanh nghiệp"), { target: { value: "mock-validation-issues" } });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an@example.com" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "an.nguyen" } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.click(screen.getByRole("checkbox"));

      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      await waitFor(
        () => {
          expect(screen.getByText("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("validates step 2 fields and terms checkbox", () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), {
        target: { value: "Đông Á Corp" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // In step 2, click submit directly
      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      expect(screen.getByText("Vui lòng nhập họ và tên đệm.")).toBeInTheDocument();
    });

    it("handles mock error: slug already taken by returning to step 1", async () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      // Step 1: use "da-ton-tai"
      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), {
        target: { value: "Công ty Đã tồn tại" },
      });
      fireEvent.change(screen.getByLabelText("Mã doanh nghiệp"), {
        target: { value: "da-ton-tai" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an@example.com" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "an.nguyen" } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Admin@1234" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "Admin@1234" } });
      fireEvent.click(screen.getByRole("checkbox"));

      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      await waitFor(
        () => {
          expect(screen.getByRole("heading", { name: "Tạo doanh nghiệp mới" })).toBeInTheDocument();
          expect(screen.getByText(/Mã doanh nghiệp đã được dùng/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("handles mock error: email taken and username taken in step 2", async () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      // Step 1
      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), { target: { value: "Đông Á" } });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2 with email starting with trung@
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "trung@example.com" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "an.nguyen" } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Admin@1234" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "Admin@1234" } });
      fireEvent.click(screen.getByRole("checkbox"));

      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/Email này đã được đăng ký/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("completes registration successfully with mock note", async () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      // Step 1
      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), { target: { value: "Công ty Cổ phần Alpha" } });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Trần" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "Bình" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "binh.tran@alpha.vn" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "binh.tran" } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.click(screen.getByLabelText(/Tôi đồng ý với điều khoản sử dụng/i));

      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Thông tin hợp lệ (bản thử)" })).toBeInTheDocument();
        expect(screen.getByText("Công ty Cổ phần Alpha")).toBeInTheDocument();
        expect(screen.getByText(/chưa được tạo thật/i)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Về trang giới thiệu" })).toBeInTheDocument();
      });
    });

    it("validates terms checkbox error: shows error, sets aria-invalid, and error element has no negative marginTop", () => {
      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      // Step 1
      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), { target: { value: "Đông Á Corp" } });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2: Fill all fields EXCEPT terms checkbox
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an@donga.vn" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "an.nguyen" } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "DigiX@2026!" } });

      const termsCheckbox = screen.getByRole("checkbox") as HTMLInputElement;
      expect(termsCheckbox.checked).toBe(false);

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      // Check error is shown
      const errorMsg = screen.getByText("Vui lòng đồng ý với điều khoản sử dụng để tiếp tục.");
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg.id).toBe("terms-err");

      // Check aria attributes on checkbox
      expect(termsCheckbox.getAttribute("aria-invalid")).toBe("true");
      expect(termsCheckbox.getAttribute("aria-describedby")).toBe("terms-err");

      // Verify no negative margin
      const errorStyle = (errorMsg as HTMLElement).style;
      expect(errorStyle.marginTop).not.toMatch(/-/);
      expect(errorStyle.paddingLeft).toBe("28px");
    });

    it("completes registration in api mode with 'Đã tạo doanh nghiệp' and 'Đăng nhập' button", async () => {
      delete process.env.REGISTRATION_API_MODE;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          tenantId: "tenant-donga",
          tenantSlug: "donga",
          username: "an.nguyen",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const onBackToChoice = vi.fn();
      render(<TenantRegistrationForm onBackToChoice={onBackToChoice} />);

      // Step 1
      fireEvent.change(screen.getByLabelText("Tên doanh nghiệp"), { target: { value: "Đông Á Corp" } });
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2
      fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn" } });
      fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
      fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an@donga.vn" } });
      fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "an.nguyen" } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "DigiX@2026!" } });
      fireEvent.click(screen.getByLabelText(/Tôi đồng ý với điều khoản sử dụng/i));

      fireEvent.click(screen.getByRole("button", { name: /Tạo doanh nghiệp/i }));

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Đã tạo doanh nghiệp" })).toBeInTheDocument();
        expect(screen.getByText("Đông Á Corp")).toBeInTheDocument();
        expect(screen.getByText("an.nguyen")).toBeInTheDocument();
        expect(screen.queryByText(/chưa được tạo thật/i)).not.toBeInTheDocument();
        const loginLink = screen.getByRole("link", { name: "Đăng nhập" });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink.getAttribute("href")).toBe("/login");
      });
    });
  });
});
