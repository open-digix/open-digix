import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AccountRequestForm from "./AccountRequestForm";

describe("AccountRequestForm", () => {
  it("renders form fields, labels, and helper note", () => {
    render(<AccountRequestForm />);

    expect(screen.getByRole("heading", { name: "Yêu cầu cấp tài khoản" })).toBeInTheDocument();
    expect(screen.getByLabelText("Họ và tên đệm")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Email công việc")).toBeInTheDocument();
    expect(screen.getByLabelText("Mã doanh nghiệp")).toBeInTheDocument();
    expect(screen.getByLabelText(/Ghi chú cho quản trị viên/i)).toBeInTheDocument();

    expect(screen.getByText(/Hệ thống tiếp nhận yêu cầu và gửi thông báo tới quản trị viên doanh nghiệp/i)).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", () => {
    render(<AccountRequestForm />);

    const submitBtn = screen.getByRole("button", { name: /Gửi yêu cầu/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Vui lòng nhập họ và tên đệm.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập tên.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập email công việc.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mã doanh nghiệp.")).toBeInTheDocument();
  });

  it("validates email format", () => {
    render(<AccountRequestForm />);

    fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn Văn" } });
    fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
    fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText("Mã doanh nghiệp"), { target: { value: "cong-ty-abc" } });

    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu/i }));

    expect(screen.getByText("Email chưa đúng định dạng.")).toBeInTheDocument();
    expect(screen.queryByText("Vui lòng nhập họ và tên đệm.")).not.toBeInTheDocument();
    expect(screen.queryByText("Vui lòng nhập tên.")).not.toBeInTheDocument();
    expect(screen.queryByText("Vui lòng nhập mã doanh nghiệp.")).not.toBeInTheDocument();
  });

  it("transitions to success view upon valid submit", async () => {
    vi.useFakeTimers();
    render(<AccountRequestForm />);

    fireEvent.change(screen.getByLabelText("Họ và tên đệm"), { target: { value: "Nguyễn Văn" } });
    fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "An" } });
    fireEvent.change(screen.getByLabelText("Email công việc"), { target: { value: "an.nguyen@example.com" } });
    fireEvent.change(screen.getByLabelText("Mã doanh nghiệp"), { target: { value: "cong-ty-abc" } });

    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu/i }));

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByRole("heading", { name: "Đã ghi nhận yêu cầu" })).toBeInTheDocument();
    expect(screen.getByText("an.nguyen@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về trang đăng nhập" })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
