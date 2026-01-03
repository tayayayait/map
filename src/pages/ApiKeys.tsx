import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ConfirmDangerAction from "../components/security/ConfirmDangerAction";
import MaskedValue from "../components/security/MaskedValue";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
  type: "live" | "test";
}

interface SecretPayload {
  id: string;
  name: string;
  secret: string;
  type: "live" | "test";
}

const initialKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API Key",
    prefix: "sk_live_****",
    createdAt: "2024-01-01",
    lastUsed: "2024-01-03 15:32",
    type: "live",
  },
  {
    id: "2",
    name: "Mobile App Key",
    prefix: "sk_live_****",
    createdAt: "2024-01-02",
    lastUsed: "2024-01-03 14:20",
    type: "live",
  },
  {
    id: "3",
    name: "Test Key",
    prefix: "sk_test_****",
    createdAt: "2024-01-03",
    lastUsed: null,
    type: "test",
  },
];

const buildSecret = (type: "live" | "test") => {
  const body = Math.random().toString(36).slice(2, 18);
  return `sk_${type}_${body}`;
};

const maskSecret = (secret: string) => `${secret.slice(0, 8)}****`;

const recordAuditLog = (payload: {
  action: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) => {
  if (import.meta.env.DEV) {
    console.info("[audit]", payload);
  }
};

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [secretPayload, setSecretPayload] = useState<SecretPayload | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const type = values.type as "live" | "test";
      const secret = buildSecret(type);
      const newKey: ApiKey = {
        id: crypto.randomUUID(),
        name: values.name,
        prefix: maskSecret(secret),
        createdAt: dayjs().format("YYYY-MM-DD"),
        lastUsed: null,
        type,
      };
      setKeys((prev) => [newKey, ...prev]);
      setSecretPayload({
        id: newKey.id,
        name: newKey.name,
        secret,
        type,
      });
      setIsCreateOpen(false);
      form.resetFields();
      recordAuditLog({ action: "api_key.created", targetId: newKey.id });
    } catch {
      return;
    }
  };

  const handleCloseSecretModal = () => {
    setSecretPayload(null);
  };

  const handleRevoke = (keyId: string) => {
    setKeys((prev) => prev.filter((item) => item.id !== keyId));
    message.success("API 키가 폐기되었습니다.");
    recordAuditLog({ action: "api_key.revoked", targetId: keyId });
  };

  return (
    <div style={{ padding: 24 }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            API Keys
          </Typography.Title>
          <Typography.Text type="secondary">
            API 인증에 사용하는 키를 관리합니다.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateOpen(true)}
        >
          새 API 키 발급
        </Button>
      </Space>

      <Alert
        type="warning"
        showIcon
        message="Secret 키는 1회만 표시되며 복사 후 안전하게 보관해야 합니다."
        style={{ marginTop: 16 }}
      />

      <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 16 }}>
        {keys.map((key) => (
          <Card key={key.id}>
            <Space
              align="center"
              style={{ width: "100%", justifyContent: "space-between" }}
            >
              <div>
                <Space size={8}>
                  <Typography.Text strong>{key.name}</Typography.Text>
                  <Tag color={key.type === "live" ? "green" : "gold"}>
                    {key.type === "live" ? "Live" : "Test"}
                  </Tag>
                </Space>
                <div style={{ marginTop: 4, color: "var(--color-text-muted)" }}>
                  <span>생성일: {key.createdAt}</span>
                  <span style={{ marginLeft: 12 }}>
                    마지막 사용: {key.lastUsed ?? "사용 기록 없음"}
                  </span>
                </div>
              </div>
              <Space>
                <MaskedValue
                  value={null}
                  maskedValue={key.prefix}
                  canReveal={false}
                  allowCopy={false}
                  disabledReason="Secret 키는 1회만 표시됩니다."
                />
                <ConfirmDangerAction
                  actionLabel="폐기"
                  title="API 키 폐기"
                  description="폐기한 키는 즉시 비활성화되며 복구할 수 없습니다."
                  confirmText="OK"
                  buttonProps={{
                    icon: <DeleteOutlined />,
                    "aria-label": "API 키 폐기",
                  }}
                  onConfirm={() => handleRevoke(key.id)}
                />
              </Space>
            </Space>
          </Card>
        ))}
      </Space>

      <Card style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">
          API 연동 방법은{" "}
          <a href="#" style={{ color: "var(--color-brand-primary)" }}>
            개발자 문서
          </a>
          를 참고하세요.
        </Typography.Text>
      </Card>

      <Modal
        title="새 API 키 발급"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        okText="발급하기"
        cancelText="취소"
        onOk={handleCreate}
        focusTriggerAfterClose
      >
        <Typography.Paragraph type="secondary">
          새 키를 발급하면 Secret 키는 1회만 표시됩니다.
        </Typography.Paragraph>
        <Form layout="vertical" form={form}>
          <Form.Item
            label="키 이름"
            name="name"
            rules={[{ required: true, message: "키 이름을 입력하세요." }]}
          >
            <Input placeholder="예: Production API Key" />
          </Form.Item>
          <Form.Item
            label="환경"
            name="type"
            rules={[{ required: true, message: "환경을 선택하세요." }]}
          >
            <Select
              placeholder="환경 선택"
              options={[
                { value: "live", label: "Live" },
                { value: "test", label: "Test" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Secret 키 발급 완료"
        open={!!secretPayload}
        onCancel={handleCloseSecretModal}
        onOk={handleCloseSecretModal}
        okText="확인"
        cancelButtonProps={{ style: { display: "none" } }}
        focusTriggerAfterClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Alert
            type="warning"
            showIcon
            message="Secret 키는 1회만 표시됩니다. 지금 복사하여 안전하게 보관하세요."
          />
          <Typography.Text strong>
            {secretPayload ? `${secretPayload.name} (${secretPayload.type})` : ""}
          </Typography.Text>
          <MaskedValue
            value={secretPayload?.secret ?? null}
            autoReveal
            oneTime
            revealDurationMs={5000}
            disabledReason="Secret 키는 1회만 표시됩니다."
            onReveal={() => {
              if (secretPayload) {
                recordAuditLog({
                  action: "api_key.secret_revealed",
                  targetId: secretPayload.id,
                });
              }
            }}
            onCopy={() => {
              if (secretPayload) {
                recordAuditLog({
                  action: "api_key.secret_copied",
                  targetId: secretPayload.id,
                });
              }
            }}
          />
          <Typography.Text type="secondary">
            5초 후 자동으로 마스킹되며 다시 확인할 수 없습니다.
          </Typography.Text>
        </Space>
      </Modal>
    </div>
  );
}
