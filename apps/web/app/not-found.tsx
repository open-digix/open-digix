import Link from "next/link";
import Image from "next/image";
import EnforceLightMode from "@/components/common/EnforceLightMode";

export default function NotFound() {
  return (
    <div
      data-theme="light"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--ws-bg-canvas)",
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        color: "var(--ws-text)",
      }}
    >
      <EnforceLightMode />
      <div
        style={{
          width: "min(480px, 100%)",
          background: "var(--ws-bg-surface)",
          borderRadius: "16px",
          border: "1px solid var(--ws-border)",
          boxShadow: "var(--ws-shadow)",
          padding: "36px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <Image
            src="/digix-logo.svg"
            alt="DigiX"
            width={52}
            height={52}
            priority
            style={{ margin: "0 auto" }}
          />
        </div>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ws-accent)",
            margin: "0 0 8px",
          }}
        >
          404 · KHÔNG TÌM THẤY TRANG
        </p>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0 0 12px",
            color: "var(--ws-text)",
          }}
        >
          Trang không tồn tại
        </h1>
        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--ws-text-muted)",
            margin: "0 0 28px",
          }}
        >
          Đường dẫn bạn truy cập có thể bị sai hoặc trang đã được chuyển sang địa chỉ mới.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 20px",
              borderRadius: "8px",
              background: "var(--ws-accent)",
              color: "var(--ws-text-on-accent)",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ← Về trang chủ
          </Link>
          <Link
            href="/apps"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid var(--ws-border)",
              background: "var(--ws-bg-surface)",
              color: "var(--ws-text)",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Vào ứng dụng →
          </Link>
        </div>
      </div>
    </div>
  );
}
