import { useId, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "@/lib/format";

interface Settlement {
  id: string;
  period: string;
  totalAmount: number;
  fee: number;
  netAmount: number;
  status: "completed" | "processing" | "scheduled";
  settleDate: string;
}

const settlements: Settlement[] = [
  {
    id: "STL-202401-001",
    period: "2024년 1월 1주차",
    totalAmount: 45230000,
    fee: 1357000,
    netAmount: 43873000,
    status: "completed",
    settleDate: "2024-01-08",
  },
  {
    id: "STL-202312-004",
    period: "2023년 12월 4주차",
    totalAmount: 52180000,
    fee: 1565000,
    netAmount: 50615000,
    status: "processing",
    settleDate: "2024-01-01",
  },
  {
    id: "STL-202312-003",
    period: "2023년 12월 3주차",
    totalAmount: 48750000,
    fee: 1462500,
    netAmount: 47287500,
    status: "completed",
    settleDate: "2023-12-25",
  },
  {
    id: "STL-202312-002",
    period: "2023년 12월 2주차",
    totalAmount: 41200000,
    fee: 1236000,
    netAmount: 39964000,
    status: "completed",
    settleDate: "2023-12-18",
  },
  {
    id: "STL-202312-001",
    period: "2023년 12월 1주차",
    totalAmount: 39800000,
    fee: 1194000,
    netAmount: 38606000,
    status: "scheduled",
    settleDate: "2023-12-11",
  },
];

const statusConfig = {
  completed: { label: "정산 완료", color: "green", icon: <CheckCircleOutlined /> },
  processing: { label: "계산중", color: "blue", icon: <ClockCircleOutlined /> },
  scheduled: { label: "예정", color: "default", icon: <ClockCircleOutlined /> },
};

type DownloadState = "idle" | "preparing" | "failed";

export default function Settlements() {
  const [downloadState, setDownloadState] = useState<Record<string, DownloadState>>({});
  const [failedOnce, setFailedOnce] = useState<Record<string, boolean>>({});
  const captionId = useId();
  const liveMessage = `총 ${settlements.length}건의 정산 리포트가 표시됩니다.`;

  const downloadXlsx = async (record: Settlement) => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet([
      {
        "정산 ID": record.id,
        "정산 기간": record.period,
        "거래 금액": record.totalAmount,
        "수수료": record.fee,
        "정산 금액": record.netAmount,
        "상태": statusConfig[record.status].label,
        "정산일": record.settleDate,
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Settlement");
    XLSX.writeFile(workbook, `${record.id}.xlsx`);
  };

  const requestDownload = async (record: Settlement, isRetry = false) => {
    if (record.status !== "completed") return;
    if (downloadState[record.id] === "preparing") return;

    setDownloadState((prev) => ({ ...prev, [record.id]: "preparing" }));
    const messageKey = `settlement-${record.id}`;
    message.loading({ content: "파일 생성 중...", key: messageKey, duration: 0 });

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const shouldFail =
      !isRetry && record.id === "STL-202312-003" && !failedOnce[record.id];

    if (shouldFail) {
      setFailedOnce((prev) => ({ ...prev, [record.id]: true }));
      setDownloadState((prev) => ({ ...prev, [record.id]: "failed" }));
      message.error({
        content: "파일 생성에 실패했습니다. 다시 시도해 주세요.",
        key: messageKey,
      });
      return;
    }

    message.success({
      content: "파일 준비가 완료되었습니다. 다운로드를 시작합니다.",
      key: messageKey,
    });
    await downloadXlsx(record);
    setDownloadState((prev) => ({ ...prev, [record.id]: "idle" }));
  };

  const columns: ColumnsType<Settlement> = [
    { title: "정산 ID", dataIndex: "id", key: "id", width: 160 },
    { title: "정산 기간", dataIndex: "period", key: "period" },
    {
      title: "거래 금액",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (value: number) => formatCurrency(value, "KRW"),
    },
    {
      title: "수수료",
      dataIndex: "fee",
      key: "fee",
      align: "right",
      render: (value: number) => `-${formatCurrency(value, "KRW")}`,
    },
    {
      title: "정산 금액",
      dataIndex: "netAmount",
      key: "netAmount",
      align: "right",
      render: (value: number) => formatCurrency(value, "KRW"),
    },
    {
      title: "상태",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (value: Settlement["status"]) => {
        const status = statusConfig[value];
        return (
          <Tag color={status.color} icon={status.icon}>
            {status.label}
          </Tag>
        );
      },
    },
    { title: "정산일", dataIndex: "settleDate", key: "settleDate", width: 120 },
    {
      title: "",
      key: "download",
      width: 140,
      render: (_, record) => {
        const state = downloadState[record.id] ?? "idle";

        if (record.status !== "completed") {
          return (
            <Button type="text" icon={<DownloadOutlined />} disabled>
              {record.status === "processing" ? "계산중" : "예정"}
            </Button>
          );
        }

        if (state === "preparing") {
          return (
            <Button type="text" loading icon={<DownloadOutlined />}>
              준비중
            </Button>
          );
        }

        if (state === "failed") {
          return (
            <Button
              type="text"
              danger
              icon={<ReloadOutlined />}
              onClick={() => requestDownload(record, true)}
            >
              재시도
            </Button>
          );
        }

        return (
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => requestDownload(record)}
          >
            다운로드
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          정산 리포트
        </Typography.Title>
        <Typography.Text type="secondary">
          주간 정산 내역을 확인하고 리포트를 다운로드합니다.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">이번 정산액</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0" }}>
              {formatCurrency(43873000, "KRW")}
            </Typography.Title>
            <Typography.Text type="secondary">1건 정산</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">지급 예정 정산액</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0" }}>
              {formatCurrency(76472500, "KRW")}
            </Typography.Title>
            <Typography.Text type="secondary">4건 정산</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">다음 정산 예정일</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0" }}>
              2024-01-15
            </Typography.Title>
            <Typography.Text type="secondary">5일 후</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="sr-only" aria-live="polite">
          {liveMessage}
        </div>
        <div role="region" aria-labelledby={captionId}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={settlements}
            components={{
              table: (props) => (
                <table {...props}>
                  <caption id={captionId} className="sr-only">
                    정산 리포트 목록
                  </caption>
                  {props.children}
                </table>
              ),
            }}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              total: 24,
              showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}건`,
            }}
          />
        </div>
      </Card>
    </div>
  );
}
