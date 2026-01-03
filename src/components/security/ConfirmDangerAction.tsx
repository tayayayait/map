import { useState } from "react";
import { Button, Input, Modal, Space, Typography } from "antd";
import type { ButtonProps } from "antd";

interface ConfirmDangerActionProps {
  actionLabel: string;
  title: string;
  description?: string;
  confirmText?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  buttonProps?: ButtonProps;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDangerAction({
  actionLabel,
  title,
  description,
  confirmText = "OK",
  confirmButtonText = "확인",
  cancelButtonText = "취소",
  buttonProps,
  onConfirm,
}: ConfirmDangerActionProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setValue("");
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
      handleClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <Button
        danger
        type="text"
        {...buttonProps}
        onClick={() => setOpen(true)}
      >
        {actionLabel}
      </Button>
      <Modal
        open={open}
        onCancel={handleClose}
        onOk={handleConfirm}
        okText={confirmButtonText}
        cancelText={cancelButtonText}
        okButtonProps={{ danger: true, disabled: value !== confirmText }}
        confirmLoading={confirming}
        title={title}
        focusTriggerAfterClose
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {description ? (
            <Typography.Paragraph type="secondary">
              {description}
            </Typography.Paragraph>
          ) : null}
          <Typography.Text>
            계속하려면 <strong>{confirmText}</strong> 를 입력하세요.
          </Typography.Text>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={confirmText}
            aria-label="위험 작업 확인 입력"
          />
        </Space>
      </Modal>
    </>
  );
}
