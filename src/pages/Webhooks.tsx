import { useId, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import ConfirmDangerAction from "../components/security/ConfirmDangerAction";
import MaskedValue from "../components/security/MaskedValue";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  lastTriggered: string | null;
  status: "active" | "failing" | "disabled";
  failCount: number;
}

interface FailureLog {
  id: string;
  webhookId: string;
  webhookUrl: string;
  event: string;
  occurredAt: string;
  statusCode: number;
  message: string;
}

const initialWebhooks: Webhook[] = [
  {
    id: "wh_1",
    url: "https://api.partner.com/webhooks/payments",
    events: ["payment.success", "payment.failed"],
    enabled: true,
    createdAt: "2024-01-01",
    lastTriggered: "2024-01-03 15:30:22",
    status: "active",
    failCount: 0,
  },
  {
    id: "wh_2",
    url: "https://api.partner.com/webhooks/refunds",
    events: ["refund.requested", "refund.completed"],
    enabled: true,
    createdAt: "2024-01-02",
    lastTriggered: "2024-01-03 14:20:15",
    status: "failing",
    failCount: 3,
  },
  {
    id: "wh_3",
    url: "https://api.partner.com/webhooks/settlements",
    events: ["settlement.completed"],
    enabled: false,
    createdAt: "2024-01-03",
    lastTriggered: null,
    status: "disabled",
    failCount: 0,
  },
];

const initialFailureLogs: FailureLog[] = [
  {
    id: "log_1",
    webhookId: "wh_2",
    webhookUrl: "https://api.partner.com/webhooks/refunds",
    event: "refund.requested",
    occurredAt: "2024-01-03 14:18:02",
    statusCode: 500,
    message: "응답 본문이 비어 있습니다.",
  },
  {
    id: "log_2",
    webhookId: "wh_2",
    webhookUrl: "https://api.partner.com/webhooks/refunds",
    event: "refund.completed",
    occurredAt: "2024-01-03 13:55:31",
    statusCode: 504,
    message: "응답 타임아웃이 발생했습니다.",
  },
];

const availableEvents = [
  { id: "payment.success", label: "결제 성공", category: "결제" },
  { id: "payment.failed", label: "결제 실패", category: "결제" },
  { id: "payment.cancelled", label: "결제 취소", category: "결제" },
  { id: "refund.requested", label: "환불 요청", category: "환불" },
  { id: "refund.completed", label: "환불 완료", category: "환불" },
  { id: "settlement.completed", label: "정산 완료", category: "정산" },
];

const statusConfig: Record<Webhook["status"], { label: string; color: string }> = {
  active: { label: "정상", color: "green" },
  failing: { label: "실패", color: "red" },
  disabled: { label: "비활성", color: "default" },
};

const createWebhookSecret = () => `whsec_${Math.random().toString(36).slice(2, 18)}`;

const recordAuditLog = (payload: {
  action: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) => {
  if (import.meta.env.DEV) {
    console.info("[audit]", payload);
  }
};

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [failureLogs, setFailureLogs] = useState<FailureLog[]>(initialFailureLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [secret, setSecret] = useState(createWebhookSecret);
  const [secretRotatedAt, setSecretRotatedAt] = useState(
    dayjs().format("YYYY-MM-DD HH:mm"),
  );
  const webhooksCaptionId = useId();
  const failuresCaptionId = useId();
  const [form] = Form.useForm();

  const handleTestWebhook = async (endpoint: Webhook) => {
    setTestingId(endpoint.id);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const shouldFail = endpoint.status === "failing" || endpoint.url.includes("refunds");
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

    if (shouldFail) {
      const log: FailureLog = {
        id: crypto.randomUUID(),
        webhookId: endpoint.id,
        webhookUrl: endpoint.url,
        event: endpoint.events[0],
        occurredAt: now,
        statusCode: 500,
        message: "테스트 전송 실패 (서버 응답 오류).",
      };
      setFailureLogs((prev) => [log, ...prev].slice(0, 20));
      setWebhooks((prev) =>
        prev.map((item) =>
          item.id === endpoint.id
            ? {
                ...item,
                lastTriggered: now,
                status: "failing",
                failCount: item.failCount + 1,
              }
            : item,
        ),
      );
      message.error("테스트 전송 실패. 실패 로그를 확인하세요.");
    } else {
      setWebhooks((prev) =>
        prev.map((item) =>
          item.id === endpoint.id
            ? { ...item, lastTriggered: now, status: "active", failCount: 0 }
            : item,
        ),
      );
      message.success("테스트 이벤트 전송 성공");
    }

    recordAuditLog({
      action: "webhook.test_sent",
      targetId: endpoint.id,
      meta: { result: shouldFail ? "failure" : "success" },
    });
    setTestingId(null);
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setWebhooks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled } : item)),
    );
    recordAuditLog({
      action: "webhook.toggle",
      targetId: id,
      meta: { enabled },
    });
  };

  const handleDelete = (id: string) => {
    setWebhooks((prev) => prev.filter((item) => item.id !== id));
    message.success("웹훅이 삭제되었습니다.");
    recordAuditLog({ action: "webhook.deleted", targetId: id });
  };

  const handleCreateWebhook = async () => {
    try {
      const values = await form.validateFields();
      const now = dayjs();
      const newWebhook: Webhook = {
        id: `wh_${now.valueOf()}`,
        url: values.url,
        events: values.events,
        enabled: true,
        createdAt: now.format("YYYY-MM-DD"),
        lastTriggered: null,
        status: "active",
        failCount: 0,
      };
      setWebhooks((prev) => [newWebhook, ...prev]);
      setIsModalOpen(false);
      form.resetFields();
      message.success("웹훅이 등록되었습니다.");
      recordAuditLog({
        action: "webhook.created",
        targetId: newWebhook.id,
        meta: { url: newWebhook.url },
      });
    } catch {
      return;
    }
  };

  const handleReissueSecret = () => {
    setSecret(createWebhookSecret());
    setSecretRotatedAt(dayjs().format("YYYY-MM-DD HH:mm"));
    message.success("새 웹훅 시크릿이 발급되었습니다.");
    recordAuditLog({ action: "webhook.secret_rotated" });
  };

  const webhookColumns: ColumnsType<Webhook> = [
    {
      title: "상태",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (value: Webhook["status"]) => (
        <Tag color={statusConfig[value].color}>{statusConfig[value].label}</Tag>
      ),
    },
    {
      title: "웹훅 URL",
      dataIndex: "url",
      key: "url",
      render: (_, record) => (
        <div>
          <Space>
            <Typography.Text code>{record.url}</Typography.Text>
            <Button
              type="text"
              icon={<CopyOutlined />}
              aria-label="웹훅 URL 복사"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(record.url);
                  message.success("URL이 복사되었습니다.");
                } catch {
                  message.error("복사에 실패했습니다.");
                }
              }}
            />
          </Space>
          {record.status === "failing" && (
            <div style={{ fontSize: 12, color: "var(--color-status-danger-fg)" }}>
              최근 {record.failCount}회 전송 실패
            </div>
          )}
        </div>
      ),
    },
    {
      title: "이벤트",
      dataIndex: "events",
      key: "events",
      render: (events: string[]) => (
        <Space wrap>
          {events.map((event) => (
            <Tag key={event}>{event}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "마지막 전송",
      dataIndex: "lastTriggered",
      key: "lastTriggered",
      width: 160,
      render: (value: string | null) => value ?? "-",
    },
    {
      title: "활성화",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      render: (value: boolean, record) => (
        <Switch checked={value} onChange={(checked) => handleToggle(record.id, checked)} />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={
              testingId === record.id ? <ReloadOutlined spin /> : <ExperimentOutlined />
            }
            onClick={() => handleTestWebhook(record)}
            disabled={testingId === record.id}
            aria-label="웹훅 테스트 전송"
          >
            테스트
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label="웹훅 삭제"
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const failureColumns: ColumnsType<FailureLog> = [
    { title: "시간", dataIndex: "occurredAt", key: "occurredAt", width: 160 },
    { title: "웹훅", dataIndex: "webhookUrl", key: "webhookUrl" },
    { title: "이벤트", dataIndex: "event", key: "event", width: 160 },
    {
      title: "상태",
      key: "status",
      width: 100,
      render: (_, record) => <Tag color="red">{record.statusCode}</Tag>,
    },
    { title: "오류", dataIndex: "message", key: "message" },
  ];

  const failureEmpty = useMemo(() => failureLogs.length === 0, [failureLogs]);
  const webhooksLive = `총 ${webhooks.length}개의 웹훅이 등록되어 있습니다.`;
  const failuresLive = `총 ${failureLogs.length}건의 실패 로그가 표시됩니다.`;

  return (
    <div style={{ padding: 24 }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Webhooks
          </Typography.Title>
          <Typography.Text type="secondary">
            실시간 이벤트 알림을 위한 웹훅을 관리합니다.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          웹훅 추가
        </Button>
      </Space>

      <Alert
        type="info"
        showIcon
        message="웹훅 연동 가이드는 이벤트 페이로드 형식과 재시도 정책을 참고하세요."
        style={{ marginTop: 16 }}
      />

      <Card style={{ marginTop: 16 }}>
        <div className="sr-only" aria-live="polite">
          {webhooksLive}
        </div>
        <div role="region" aria-labelledby={webhooksCaptionId}>
          <Table
            rowKey="id"
            columns={webhookColumns}
            dataSource={webhooks}
            pagination={false}
            components={{
              table: (props) => (
                <table {...props}>
                  <caption id={webhooksCaptionId} className="sr-only">
                    웹훅 목록
                  </caption>
                  {props.children}
                </table>
              ),
            }}
          />
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              웹훅 시크릿
            </Typography.Title>
            <Typography.Text type="secondary">
              서명 검증에 사용하는 비밀키입니다. 마지막 재발급: {secretRotatedAt}
            </Typography.Text>
          </div>
          <Space>
            <MaskedValue
              value={secret}
              revealDurationMs={5000}
              copyWarning="웹훅 시크릿이 복사되었습니다. 외부 공유를 금지합니다."
              onReveal={() => recordAuditLog({ action: "webhook.secret_revealed" })}
              onCopy={() => recordAuditLog({ action: "webhook.secret_copied" })}
            />
            <ConfirmDangerAction
              actionLabel="재발급"
              title="웹훅 시크릿 재발급"
              description="재발급하면 기존 시크릿은 즉시 폐기됩니다. 연동 시스템에 새 시크릿을 반영하세요."
              confirmText="REISSUE"
              buttonProps={{ type: "primary" }}
              onConfirm={handleReissueSecret}
            />
          </Space>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            실패 로그
          </Typography.Title>
          <Typography.Text type="secondary">
            최근 20건까지 표시됩니다.
          </Typography.Text>
        </Space>
        <div className="sr-only" aria-live="polite">
          {failuresLive}
        </div>
        <div role="region" aria-labelledby={failuresCaptionId}>
          <Table
            rowKey="id"
            columns={failureColumns}
            dataSource={failureLogs}
            pagination={false}
            locale={{ emptyText: failureEmpty ? "실패 로그가 없습니다." : undefined }}
            components={{
              table: (props) => (
                <table {...props}>
                  <caption id={failuresCaptionId} className="sr-only">
                    웹훅 실패 로그
                  </caption>
                  {props.children}
                </table>
              ),
            }}
            style={{ marginTop: 12 }}
          />
        </div>
      </Card>

      <Modal
        title="웹훅 추가"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateWebhook}
        okText="웹훅 추가"
        cancelText="취소"
        focusTriggerAfterClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="웹훅 URL"
            name="url"
            validateTrigger="onBlur"
            rules={[
              { required: true, message: "URL을 입력하세요." },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    const parsed = new URL(value);
                    if (parsed.protocol !== "https:") {
                      return Promise.reject(new Error("HTTPS URL만 허용됩니다."));
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error("유효한 URL을 입력하세요."));
                  }
                },
              },
            ]}
          >
            <Input placeholder="https://your-domain.com/webhooks" />
          </Form.Item>
          <Form.Item
            label="이벤트"
            name="events"
            rules={[{ required: true, message: "이벤트를 선택하세요." }]}
          >
            <Checkbox.Group>
              <Space direction="vertical">
                {availableEvents.map((event) => (
                  <Checkbox key={event.id} value={event.id}>
                    {event.label} <Tag>{event.category}</Tag>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
