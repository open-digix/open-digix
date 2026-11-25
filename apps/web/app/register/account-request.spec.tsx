import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AccountRequestForm from "./AccountRequestForm";

describe("AccountRequestForm (R3)", () => {
  it("renders form fields, labels, and BE-08 note", () => {
    render(<AccountRequestForm />);

    expect(screen.getByRole("heading", { name: "Yêu cầu cấp tài khoản" })).toBeInTheDocument();
    expect(screen.getByLabelText("Họ và tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Email công việc")).toBeInTheDocument();
    expect(screen.getByLabelText("Doanh nghiệp")).toBeInTheDocument();
    expect(screen.getByLabelText("Vai trò mong muốn")).toBeInTheDocument();
    expect(screen.getByLabelText(/Ghi chú cho quản trị viên/i)).toBeInTheDocument();

    expect(screen.getByText(/Tính năng gửi yêu cầu trực tiếp đang trong quá trình phát triển \(BE-08\)/i)).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", () => {
    render(<AccountRequestForm />);

    const submitBtn = screen.getByRole("button", { name: /Gửi yêu cầu/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Vui lòng nhập họ và tên.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Chọn doanh nghiệp.")).toBeInTheDocument();
    expect(screen.getByText("Chọn vai trò.")).toBeInTheDocument();
  });

  it("validates email format", () => {
    render(<AccountRequestForm />);

    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn Văn An" } });
    fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText("Doanh nghiệp"), { target: { value: "tenant-alpha" } });
    fireEvent.change(screen.getByLabelText("Vai trò mong muốn"), { target: { value: "employee" } });

    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu/i }));

    expect(screen.getByText("Email chưa đúng định dạng.")).toBeInTheDocument();
    expect(screen.queryByText("Vui lòng nhập họ và tên.")).not.toBeInTheDocument();
  });

  it("transitions to success view upon valid submit", async () => {
    vi.useFakeTimers();
    render(<AccountRequestForm />);

    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn Văn An" } });
    fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an.nguyen@example.com" } });
    fireEvent.change(screen.getByLabelText("Doanh nghiệp"), { target: { value: "tenant-alpha" } });
    fireEvent.change(screen.getByLabelText("Vai trò mong muốn"), { target: { value: "employee" } });

    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu/i }));

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByRole("heading", { name: "Đã ghi nhận (bản thử)" })).toBeInTheDocument();
    expect(screen.getByText("an.nguyen@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về trang đăng nhập" })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
