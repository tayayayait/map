import { useEffect, useState } from "react";
import { Alert } from "antd";

export function GlobalBanner() {
  const [visible, setVisible] = useState(true);
  const [sessionExpiredAt, setSessionExpiredAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("sessionExpiredAt");
    if (stored) setSessionExpiredAt(stored);
  }, []);

  if (!visible || !sessionExpiredAt) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <Alert
        message="세션이 만료되어 로그아웃되었습니다."
        description="다시 로그인해 주세요."
        type="warning"
        showIcon
        closable
        onClose={() => {
          localStorage.removeItem("sessionExpiredAt");
          setVisible(false);
        }}
      />
    </div>
  );
}
