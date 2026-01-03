import { useMemo, useState } from "react";
import {
  Card,
  Col,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  AlertOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  LineChartOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "@/lib/format";

type RangeKey = "7d" | "30d" | "90d";

const chartData: Record<RangeKey, { date: string; amount: number }[]> = {
  "7d": [
    { date: "1/1", amount: 4200000 },
    { date: "1/2", amount: 3800000 },
    { date: "1/3", amount: 5100000 },
    { date: "1/4", amount: 4700000 },
    { date: "1/5", amount: 6200000 },
    { date: "1/6", amount: 5900000 },
    { date: "1/7", amount: 7100000 },
  ],
  "30d": Array.from({ length: 6 }, (_, idx) => ({
    date: `W${idx + 1}`,
    amount: 18000000 + idx * 3500000,
  })),
  "90d": Array.from({ length: 6 }, (_, idx) => ({
    date: `M${idx + 1}`,
    amount: 52000000 + idx * 12000000,
  })),
};

const metrics = [
  {
    title: "오늘 거래금액",
    value: 12300000,
    subValue: "128건",
    change: 12.5,
    changeLabel: "전일 대비",
    icon: <CreditCardOutlined />,
  },
  {
    title: "이번 달 거래금액",
    value: 52450000,
    subValue: "2,847건",
    change: 8.3,
    changeLabel: "전월 대비",
    icon: <LineChartOutlined />,
  },
  {
    title: "처리 대기",
    value: 24,
    subValue: "₩1,120,000",
    icon: <ClockCircleOutlined />,
  },
  {
    title: "실패/차단",
    value: 7,
    subValue: "최근 24시간",
    change: -2.1,
    changeLabel: "전일 대비",
    icon: <AlertOutlined />,
  },
];

type RecentTx = {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: "approved" | "pending" | "failed";
  date: string;
};

const recentTransactions: RecentTx[] = [
  {
    id: "TXN001",
    orderId: "ORD-2024-0103-001",
    method: "신용카드",
    amount: 125000,
    status: "approved",
    date: "2024-01-03 15:32",
  },
  {
    id: "TXN002",
    orderId: "ORD-2024-0103-002",
    method: "계좌이체",
    amount: 89000,
    status: "approved",
    date: "2024-01-03 15:28",
  },
  {
    id: "TXN003",
    orderId: "ORD-2024-0103-003",
    method: "간편결제",
    amount: 234000,
    status: "pending",
    date: "2024-01-03 15:25",
  },
  {
    id: "TXN004",
    orderId: "ORD-2024-0103-004",
    method: "신용카드",
    amount: 55000,
    status: "failed",
    date: "2024-01-03 15:20",
  },
  {
    id: "TXN005",
    orderId: "ORD-2024-0103-005",
    method: "간편결제",
    amount: 178000,
    status: "approved",
    date: "2024-01-03 15:15",
  },
];

const statusConfig = {
  approved: { label: "승인", color: "green" },
  pending: { label: "보류", color: "gold" },
  failed: { label: "실패", color: "red" },
};

const columns: ColumnsType<RecentTx> = [
  {
    title: "주문번호",
    dataIndex: "orderId",
    key: "orderId",
  },
  {
    title: "결제수단",
    dataIndex: "method",
    key: "method",
  },
  {
    title: "금액",
    dataIndex: "amount",
    key: "amount",
    align: "right",
    render: (value: number) => formatCurrency(value, "KRW"),
  },
  {
    title: "상태",
    dataIndex: "status",
    key: "status",
    align: "center",
    render: (value: RecentTx["status"]) => (
      <Tag color={statusConfig[value].color}>{statusConfig[value].label}</Tag>
    ),
  },
  {
    title: "시간",
    dataIndex: "date",
    key: "date",
  },
];

export default function Dashboard() {
  const [range, setRange] = useState<RangeKey>("7d");
  const chartSeries = useMemo(() => chartData[range], [range]);

  const renderChange = (change?: number, label?: string) => {
    if (change === undefined) return null;
    const isPositive = change > 0;
    const isNegative = change < 0;
    const color = isPositive
      ? "var(--color-status-success-fg)"
      : isNegative
        ? "var(--color-status-danger-fg)"
        : "var(--color-text-muted)";
    const icon = isPositive ? <ArrowUpOutlined /> : isNegative ? <ArrowDownOutlined /> : <MinusOutlined />;
    return (
      <Space size={6} style={{ color }}>
        {icon}
        <Typography.Text style={{ color }}>
          {isPositive ? "+" : ""}
          {change}%
        </Typography.Text>
        {label ? <Typography.Text type="secondary">{label}</Typography.Text> : null}
      </Space>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          대시보드
        </Typography.Title>
        <Typography.Text type="secondary">
          결제 성과와 운영 지표를 한눈에 확인합니다.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col key={metric.title} xs={24} sm={12} lg={6}>
            <Card>
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <div>
                  <Typography.Text type="secondary">{metric.title}</Typography.Text>
                  <Statistic
                    value={metric.value}
                    valueStyle={{ fontSize: 22 }}
                    formatter={(value) =>
                      typeof value === "number" && metric.title.includes("금액")
                        ? formatCurrency(value, "KRW")
                        : String(value)
                    }
                  />
                  {metric.subValue ? (
                    <Typography.Text type="secondary">{metric.subValue}</Typography.Text>
                  ) : null}
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--color-bg-surface-secondary)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-brand-primary)",
                  }}
                  aria-hidden
                >
                  {metric.icon}
                </div>
              </Space>
              <div style={{ marginTop: 12 }}>{renderChange(metric.change, metric.changeLabel)}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={12}>
          <Card
            title="거래 추이"
            extra={
              <Segmented
                value={range}
                onChange={(value) => setRange(value as RangeKey)}
                options={[
                  { label: "7일", value: "7d" },
                  { label: "30일", value: "30d" },
                  { label: "90일", value: "90d" },
                ]}
              />
            }
          >
            <Typography.Text type="secondary">
              선택한 기간의 거래 금액 추이입니다.
            </Typography.Text>
            <div style={{ height: 280, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052cc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0052cc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${Math.round(value / 10000)}만`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, "KRW")}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0052cc"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="최근 거래" extra={<a href="/transactions">전체 보기</a>}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={recentTransactions}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
