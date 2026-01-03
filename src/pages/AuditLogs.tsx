import { useId, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type AuditCategory = "auth" | "api" | "settings" | "transaction" | "user";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  category: AuditCategory;
  target: string;
  ip: string;
  userAgent: string;
  status: "success" | "failure";
}

const auditLogs: AuditLogEntry[] = [
  {
    id: "1",
    timestamp: "2024-01-03 15:45:22 KST",
    user: "김민지",
    userEmail: "partner@example.com",
    action: "API 키 조회",
    category: "api",
    target: "sk_live_****1234",
    ip: "211.234.56.78",
    userAgent: "Chrome 120 / Windows 10",
    status: "success",
  },
  {
    id: "2",
    timestamp: "2024-01-03 15:32:10 KST",
    user: "관리자",
    userEmail: "admin@example.com",
    action: "사용자 역할 변경",
    category: "user",
    target: "박담당자 Viewer",
    ip: "121.134.78.90",
    userAgent: "Safari 17 / macOS",
    status: "success",
  },
  {
    id: "3",
    timestamp: "2024-01-03 15:28:45 KST",
    user: "김민지",
    userEmail: "partner@example.com",
    action: "정산 리포트 다운로드",
    category: "transaction",
    target: "STL-202401-001.xlsx",
    ip: "211.234.56.78",
    userAgent: "Chrome 120 / Windows 10",
    status: "success",
  },
  {
    id: "4",
    timestamp: "2024-01-03 15:15:33 KST",
    user: "박담당자",
    userEmail: "viewer@example.com",
    action: "로그인",
    category: "auth",
    target: "-",
    ip: "175.223.45.12",
    userAgent: "Firefox 121 / Windows 11",
    status: "success",
  },
  {
    id: "5",
    timestamp: "2024-01-03 14:58:19 KST",
    user: "알 수 없음",
    userEmail: "-",
    action: "로그인 실패",
    category: "auth",
    target: "-",
    ip: "45.67.89.123",
    userAgent: "Unknown",
    status: "failure",
  },
  {
    id: "6",
    timestamp: "2024-01-03 14:45:00 KST",
    user: "김민지",
    userEmail: "partner@example.com",
    action: "웹훅 설정 변경",
    category: "settings",
    target: "wh_1",
    ip: "211.234.56.78",
    userAgent: "Chrome 120 / Windows 10",
    status: "success",
  },
  {
    id: "7",
    timestamp: "2024-01-03 14:30:55 KST",
    user: "관리자",
    userEmail: "admin@example.com",
    action: "민감정보 조회",
    category: "api",
    target: "카드번호 ****5678",
    ip: "121.134.78.90",
    userAgent: "Safari 17 / macOS",
    status: "success",
  },
  {
    id: "8",
    timestamp: "2024-01-03 14:20:12 KST",
    user: "김민지",
    userEmail: "partner@example.com",
    action: "거래 상세 조회",
    category: "transaction",
    target: "TXN-20240103-001",
    ip: "211.234.56.78",
    userAgent: "Chrome 120 / Windows 10",
    status: "success",
  },
];

const categoryConfig: Record<AuditCategory, { label: string; color: string }> = {
  auth: { label: "인증", color: "blue" },
  api: { label: "API", color: "gold" },
  settings: { label: "설정", color: "default" },
  transaction: { label: "거래", color: "green" },
  user: { label: "사용자", color: "purple" },
};

const parseTimestamp = (value: string) =>
  dayjs(value.replace(" KST", ""), "YYYY-MM-DD HH:mm:ss", true);

export default function AuditLogs() {
  const [dateRange, setDateRange] = useState("30days");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userQuery, setUserQuery] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const captionId = useId();

  const hasPermission = useMemo(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("permissions");
    if (!stored) return true;
    try {
      const permissions = JSON.parse(stored) as string[];
      return permissions.includes("system.audit");
    } catch {
      return true;
    }
  }, []);

  const filteredLogs = useMemo(() => {
    const now = dayjs();
    const rangeStart =
      dateRange === "today"
        ? now.startOf("day")
        : dateRange === "7days"
          ? now.subtract(6, "day").startOf("day")
          : dateRange === "90days"
            ? now.subtract(89, "day").startOf("day")
            : now.subtract(29, "day").startOf("day");
    const rangeEnd = now.endOf("day");

    return auditLogs.filter((log) => {
      const ts = parseTimestamp(log.timestamp);
      if (ts.isValid() && (ts.isBefore(rangeStart) || ts.isAfter(rangeEnd))) {
        return false;
      }
      if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
      if (userQuery) {
        const haystack = `${log.user} ${log.userEmail}`.toLowerCase();
        if (!haystack.includes(userQuery.toLowerCase())) return false;
      }
      if (eventQuery) {
        if (!log.action.toLowerCase().includes(eventQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [dateRange, categoryFilter, userQuery, eventQuery]);

  const liveMessage = `총 ${filteredLogs.length}건의 감사 로그가 표시됩니다.`;

  const columns: ColumnsType<AuditLogEntry> = [
    { title: "시간", dataIndex: "timestamp", key: "timestamp", width: 180 },
    {
      title: "사용자",
      key: "user",
      width: 200,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.user}</Typography.Text>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {record.userEmail}
          </div>
        </div>
      ),
    },
    {
      title: "이벤트",
      key: "action",
      render: (_, record) => (
        <div>
          <div>{record.action}</div>
          {record.target !== "-" && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              대상: {record.target}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "분류",
      dataIndex: "category",
      key: "category",
      align: "center",
      width: 100,
      render: (value: AuditCategory) => (
        <Tag color={categoryConfig[value].color}>
          {categoryConfig[value].label}
        </Tag>
      ),
    },
    { title: "IP", dataIndex: "ip", key: "ip", width: 140 },
    {
      title: "결과",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 100,
      render: (value: AuditLogEntry["status"]) => (
        <Badge
          color={value === "success" ? "green" : "red"}
          text={value === "success" ? "성공" : "실패"}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          aria-label="감사 로그 상세"
          onClick={() => setSelectedLog(record)}
        />
      ),
    },
  ];

  if (!hasPermission) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="403"
          title="접근 권한 없음"
          subTitle="감사 로그 조회 권한이 없습니다."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            감사 로그
          </Typography.Title>
          <Typography.Text type="secondary">
            시스템에서 발생한 모든 행동 기록을 조회합니다.
          </Typography.Text>
        </div>
        <Button icon={<DownloadOutlined />}>내보내기</Button>
      </Space>

      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Form layout="inline" style={{ rowGap: 12 }}>
          <Form.Item label="기간">
            <Select
              value={dateRange}
              onChange={setDateRange}
              style={{ width: 140 }}
              options={[
                { value: "today", label: "오늘" },
                { value: "7days", label: "최근 7일" },
                { value: "30days", label: "최근 30일" },
                { value: "90days", label: "최근 90일" },
              ]}
            />
          </Form.Item>
          <Form.Item label="사용자">
            <Input
              placeholder="사용자명 또는 이메일"
              prefix={<SearchOutlined />}
              allowClear
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="이벤트">
            <Input
              placeholder="행동 검색"
              allowClear
              value={eventQuery}
              onChange={(event) => setEventQuery(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="분류">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "전체" },
                { value: "auth", label: "인증" },
                { value: "api", label: "API" },
                { value: "settings", label: "설정" },
                { value: "transaction", label: "거래" },
                { value: "user", label: "사용자" },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button icon={<FilterOutlined />}>고급 필터</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div className="sr-only" aria-live="polite">
          {liveMessage}
        </div>
        <div role="region" aria-labelledby={captionId}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredLogs}
            components={{
              table: (props) => (
                <table {...props}>
                  <caption id={captionId} className="sr-only">
                    감사 로그 목록
                  </caption>
                  {props.children}
                </table>
              ),
            }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              total: filteredLogs.length,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / 총 ${total}건`,
            }}
          />
        </div>
      </Card>

      <Modal
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={null}
        title="활동 상세"
        focusTriggerAfterClose
      >
        {selectedLog && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="시간">
              {selectedLog.timestamp}
            </Descriptions.Item>
            <Descriptions.Item label="결과">
              <Badge
                color={selectedLog.status === "success" ? "green" : "red"}
                text={selectedLog.status === "success" ? "성공" : "실패"}
              />
            </Descriptions.Item>
            <Descriptions.Item label="사용자">
              {selectedLog.user} ({selectedLog.userEmail})
            </Descriptions.Item>
            <Descriptions.Item label="이벤트">
              {selectedLog.action}
            </Descriptions.Item>
            {selectedLog.target !== "-" && (
              <Descriptions.Item label="대상">
                {selectedLog.target}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="IP">
              {selectedLog.ip}
            </Descriptions.Item>
            <Descriptions.Item label="User Agent">
              {selectedLog.userAgent}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
