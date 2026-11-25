import { describe, it, expect, vi } from "vitest";
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
        expect(screen.getByRole("heading", { name: "Đã tạo doanh nghiệp" })).toBeInTheDocument();
        expect(screen.getByText("Công ty Cổ phần Alpha")).toBeInTheDocument();
        expect(screen.getByText(/Bản thử – chưa tạo doanh nghiệp thật \(chờ API #35\)/i)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Đăng nhập ngay" })).toBeInTheDocument();
      });
    });
  });
});
