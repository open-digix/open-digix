import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f6f8fa",
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        color: "#112b45",
      }}
    >
      <div
        style={{
          width: "min(480px, 100%)",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #d8e1e8",
          boxShadow: "0 10px 30px rgba(17, 43, 69, 0.06)",
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
            color: "#0d9488",
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
            color: "#112b45",
          }}
        >
          Trang không tồn tại
        </h1>
        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#526878",
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
              background: "#0d9488",
              color: "#ffffff",
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
              border: "1px solid #d8e1e8",
              background: "#ffffff",
              color: "#112b45",
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
