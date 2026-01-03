import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Space, Tooltip, Typography, message } from "antd";
import { CopyOutlined, EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

interface MaskedValueProps {
  value?: string | null;
  maskedValue?: string;
  revealDurationMs?: number;
  oneTime?: boolean;
  autoReveal?: boolean;
  canReveal?: boolean;
  allowCopy?: boolean;
  disabledReason?: string;
  copyWarning?: string;
  onReveal?: () => void;
  onHide?: () => void;
  onCopy?: () => void;
}

const defaultCopyWarning =
  "민감 정보가 클립보드에 복사되었습니다. 외부 공유를 금지합니다.";

export default function MaskedValue({
  value,
  maskedValue,
  revealDurationMs = 5000,
  oneTime = false,
  autoReveal = false,
  canReveal,
  allowCopy,
  disabledReason,
  copyWarning = defaultCopyWarning,
  onReveal,
  onHide,
  onCopy,
}: MaskedValueProps) {
  const [revealed, setRevealed] = useState(Boolean(autoReveal && value));
  const [hasRevealedOnce, setHasRevealedOnce] = useState(
    Boolean(autoReveal && value),
  );
  const timerRef = useRef<number | null>(null);

  const resolvedMask = useMemo(() => {
    if (maskedValue) return maskedValue;
    if (!value) return "****";
    if (value.length <= 4) return "****";
    return `${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
  }, [maskedValue, value]);

  const revealDisabled =
    !value || canReveal === false || (oneTime && hasRevealedOnce && !revealed);
  const copyDisabled = !value || allowCopy === false;

  useEffect(() => {
    if (autoReveal && value) {
      onReveal?.();
    }
  }, [autoReveal, onReveal, value]);

  useEffect(() => {
    if (!revealed) return undefined;
    if (revealDurationMs <= 0) return undefined;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setRevealed(false);
      if (oneTime) setHasRevealedOnce(true);
      onHide?.();
    }, revealDurationMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [revealed, revealDurationMs, oneTime, onHide]);

  const handleToggle = () => {
    if (revealDisabled) return;
    if (revealed) {
      setRevealed(false);
      if (oneTime) setHasRevealedOnce(true);
      onHide?.();
      return;
    }
    setRevealed(true);
    if (oneTime) setHasRevealedOnce(true);
    onReveal?.();
  };

  const handleCopy = async () => {
    if (!value || copyDisabled) return;
    try {
      await navigator.clipboard.writeText(value);
      message.warning(copyWarning);
      onCopy?.();
    } catch {
      message.error("복사에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const toggleButton = (
    <Button
      type="text"
      icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
      aria-label={revealed ? "민감 정보 숨기기" : "민감 정보 표시"}
      onClick={handleToggle}
      disabled={revealDisabled}
    />
  );

  const copyButton = (
    <Button
      type="text"
      icon={<CopyOutlined />}
      aria-label="민감 정보 복사"
      onClick={handleCopy}
      disabled={copyDisabled}
    />
  );

  return (
    <Space
      style={{
        background: "var(--color-bg-surface-secondary)",
        padding: "6px 10px",
        borderRadius: 8,
      }}
    >
      <Typography.Text code>{revealed && value ? value : resolvedMask}</Typography.Text>
      {disabledReason ? (
        <Tooltip title={disabledReason}>
          <span>{toggleButton}</span>
        </Tooltip>
      ) : (
        toggleButton
      )}
      {copyDisabled ? (
        <Tooltip title={disabledReason}>
          <span>{copyButton}</span>
        </Tooltip>
      ) : (
        copyButton
      )}
    </Space>
  );
}
