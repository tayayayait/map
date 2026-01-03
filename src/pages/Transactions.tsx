import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  EyeOutlined,
  FilterOutlined,
  MoreOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { DataTable } from "@/components/table/DataTable";
import { useRightUtility } from "@/components/layout/RightUtilityContext";
import { formatCurrency } from "@/lib/format";

type QuickRange = "today" | "yesterday" | "thisMonth" | "last7days" | "last30days";

interface Transaction {
  id: string;
  orderId: string;
  customerId: string;
  method: string;
  amount: number;
  status: "approved" | "pending" | "failed" | "cancelled";
  date: string;
  card?: string;
  failureReason?: string;
}

const transactions: Transaction[] = [
  {
    id: "TXN-20240103-001",
    orderId: "ORD-0103-001",
    customerId: "C001",
    method: "신용카드",
    amount: 125000,
    status: "approved",
    date: "2024-01-03 15:32:45",
    card: "****-1234",
  },
  {
    id: "TXN-20240103-002",
    orderId: "ORD-0103-002",
    customerId: "C002",
    method: "계좌이체",
    amount: 89000,
    status: "approved",
    date: "2024-01-03 15:28:12",
  },
  {
    id: "TXN-20240103-003",
    orderId: "ORD-0103-003",
    customerId: "C003",
    method: "간편결제",
    amount: 234000,
    status: "pending",
    date: "2024-01-03 15:25:33",
  },
  {
    id: "TXN-20240103-004",
    orderId: "ORD-0103-004",
    customerId: "C004",
    method: "신용카드",
    amount: 55000,
    status: "failed",
    date: "2024-01-03 15:20:18",
    card: "****-5678",
    failureReason: "카드 한도 초과",
  },
  {
    id: "TXN-20240103-005",
    orderId: "ORD-0103-005",
    customerId: "C005",
    method: "간편결제",
    amount: 178000,
    status: "approved",
    date: "2024-01-03 15:15:42",
  },
  {
    id: "TXN-20240103-006",
    orderId: "ORD-0103-006",
    customerId: "C006",
    method: "신용카드",
    amount: 312000,
    status: "approved",
    date: "2024-01-03 15:10:55",
    card: "****-9012",
  },
  {
    id: "TXN-20240103-007",
    orderId: "ORD-0103-007",
    customerId: "C007",
    method: "계좌이체",
    amount: 67000,
    status: "cancelled",
    date: "2024-01-03 15:05:21",
  },
  {
    id: "TXN-20240103-008",
    orderId: "ORD-0103-008",
    customerId: "C008",
    method: "간편결제",
    amount: 445000,
    status: "approved",
    date: "2024-01-03 15:00:10",
  },
];

const statusConfig: Record<
  Transaction["status"],
  { text: string; color: string }
> = {
  approved: { text: "승인", color: "green" },
  pending: { text: "대기", color: "gold" },
  failed: { text: "실패", color: "red" },
  cancelled: { text: "취소", color: "default" },
};

const quickRangeLabels: Record<QuickRange, string> = {
  today: "오늘",
  yesterday: "어제",
  thisMonth: "이번달",
  last7days: "최근 7일",
  last30days: "최근 30일",
};

const methodOptions = [
  { value: "all", label: "전체" },
  { value: "card", label: "신용카드" },
  { value: "account", label: "계좌이체" },
  { value: "easy", label: "간편결제" },
];

const methodLabelMap: Record<string, string> = {
  card: "신용카드",
  account: "계좌이체",
  easy: "간편결제",
};

type SavedFilter = {
  id: string;
  name: string;
  quickRange: QuickRange;
  status: string;
  keyword: string;
  method: string;
  amountMin: number | null;
  amountMax: number | null;
  customerId: string;
};

const STORAGE_KEY = "transactions.savedFilters";

export default function Transactions() {
  const { open, close } = useRightUtility();
  const [quickRange, setQuickRange] = useState<QuickRange>("last7days");
  const [statusFilter, setStatusFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [amountMin, setAmountMin] = useState<number | null>(null);
  const [amountMax, setAmountMax] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(8);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SavedFilter[]) : [];
  });
  const [selectedSavedFilter, setSelectedSavedFilter] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    setPageIndex(0);
  }, [quickRange, statusFilter, keyword, customerId, methodFilter, amountMin, amountMax]);

  const getDateRange = () => {
    const now = dayjs();
    switch (quickRange) {
      case "today":
        return [now.startOf("day"), now.endOf("day")];
      case "yesterday":
        return [
          now.subtract(1, "day").startOf("day"),
          now.subtract(1, "day").endOf("day"),
        ];
      case "thisMonth":
        return [now.startOf("month"), now.endOf("month")];
      case "last30days":
        return [now.subtract(29, "day").startOf("day"), now.endOf("day")];
      default:
        return [now.subtract(6, "day").startOf("day"), now.endOf("day")];
    }
  };

  const filteredData = useMemo(() => {
    const [start, end] = getDateRange();
    return transactions.filter((tx) => {
      const txDate = dayjs(tx.date);
      if (txDate.isValid() && (txDate.isBefore(start) || txDate.isAfter(end))) {
        return false;
      }
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      if (keyword) {
        const haystack = `${tx.id} ${tx.orderId}`.toLowerCase();
        if (!haystack.includes(keyword.toLowerCase())) return false;
      }
      if (customerId && !tx.customerId.includes(customerId)) return false;
      if (methodFilter !== "all" && tx.method !== methodLabelMap[methodFilter]) {
        return false;
      }
      if (amountMin !== null && tx.amount < amountMin) return false;
      if (amountMax !== null && tx.amount > amountMax) return false;
      return true;
    });
  }, [quickRange, statusFilter, keyword, customerId, methodFilter, amountMin, amountMax]);

  const sortedData = useMemo(() => {
    if (sorting.length === 0) return filteredData;
    const [{ id, desc }] = sorting;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[id];
      const bVal = (b as Record<string, unknown>)[id];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return desc ? bVal - aVal : aVal - bVal;
      }
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });
  }, [filteredData, sorting]);

  const pagedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "id",
      header: "거래 ID",
      size: 180,
      cell: (info) => <Typography.Text code>{info.getValue<string>()}</Typography.Text>,
    },
    {
      accessorKey: "orderId",
      header: "주문번호",
      size: 160,
    },
    {
      accessorKey: "method",
      header: "결제수단",
      cell: ({ row }) => (
        <div>
          <div>{row.original.method}</div>
          {row.original.card && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.original.card}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "금액",
      size: 120,
      cell: (info) => (
        <div style={{ textAlign: "right" }}>
          {formatCurrency(info.getValue<number>(), "KRW")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "상태",
      size: 120,
      cell: ({ row }) => {
        const value = row.original.status;
        const badge = (
          <Badge
            color={statusConfig[value].color}
            text={statusConfig[value].text}
          />
        );
        if (value === "failed" && row.original.failureReason) {
          return (
            <Tooltip title={row.original.failureReason} placement="top">
              {badge}
            </Tooltip>
          );
        }
        return badge;
      },
    },
    {
      accessorKey: "date",
      header: "일시",
      size: 170,
    },
    {
      id: "actions",
      header: "",
      size: 60,
      enableSorting: false,
      enableHiding: false,
      meta: { exportable: false },
      cell: ({ row }) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "detail",
                label: (
                  <Link to={`/transactions/${row.original.id}`}>
                    <EyeOutlined /> 상세 보기
                  </Link>
                ),
              },
              {
                key: "retry",
                label: (
                  <span>
                    <ReloadOutlined /> 재시도
                  </span>
                ),
              },
            ],
          }}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            aria-label="거래 더보기"
          />
        </Dropdown>
      ),
    },
  ];

  const openAdvancedFilters = () => {
    open({
      tab: "filters",
      filtersContent: (
        <Form layout="vertical">
          <Form.Item label="결제수단">
            <Select
              value={methodFilter}
              onChange={setMethodFilter}
              options={methodOptions}
            />
          </Form.Item>
          <Form.Item label="금액 범위">
            <Space>
              <InputNumber
                min={0}
                placeholder="최소 금액"
                value={amountMin ?? undefined}
                onChange={(value) => setAmountMin(value ?? null)}
              />
              <span>~</span>
              <InputNumber
                min={0}
                placeholder="최대 금액"
                value={amountMax ?? undefined}
                onChange={(value) => setAmountMax(value ?? null)}
              />
            </Space>
          </Form.Item>
          <Form.Item label="고객 ID">
            <Input
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              placeholder="고객 ID"
            />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={() => close()}>
              적용
            </Button>
            <Button
              onClick={() => {
                setMethodFilter("all");
                setAmountMin(null);
                setAmountMax(null);
                setCustomerId("");
              }}
            >
              초기화
            </Button>
          </Space>
        </Form>
      ),
    });
  };

  const handleSaveFilter = () => {
    if (!saveName.trim()) {
      message.error("필터 이름을 입력하세요.");
      return;
    }
    const newFilter: SavedFilter = {
      id: `${Date.now()}`,
      name: saveName.trim(),
      quickRange,
      status: statusFilter,
      keyword,
      method: methodFilter,
      amountMin,
      amountMax,
      customerId,
    };
    const next = [...savedFilters, newFilter];
    setSavedFilters(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSelectedSavedFilter(newFilter.id);
    setIsSaveModalOpen(false);
    setSaveName("");
    message.success("필터가 저장되었습니다.");
  };

  const applySavedFilter = (filterId: string | null) => {
    setSelectedSavedFilter(filterId);
    if (!filterId) return;
    const saved = savedFilters.find((filter) => filter.id === filterId);
    if (!saved) return;
    setQuickRange(saved.quickRange);
    setStatusFilter(saved.status);
    setKeyword(saved.keyword);
    setMethodFilter(saved.method);
    setAmountMin(saved.amountMin);
    setAmountMax(saved.amountMax);
    setCustomerId(saved.customerId);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Space
          align="center"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              거래 내역
            </Typography.Title>
            <Typography.Text type="secondary">
              모든 결제 거래를 조회하고 관리합니다
            </Typography.Text>
          </div>
          <Space>
            <Select
              placeholder="저장된 필터"
              style={{ width: 180 }}
              value={selectedSavedFilter ?? undefined}
              allowClear
              options={savedFilters.map((filter) => ({
                value: filter.id,
                label: filter.name,
              }))}
              onChange={(value) => applySavedFilter(value ?? null)}
            />
            <Button icon={<SaveOutlined />} onClick={() => setIsSaveModalOpen(true)}>
              필터 저장
            </Button>
          </Space>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" style={{ rowGap: 12, flexWrap: "wrap" }}>
          <Form.Item label="빠른 필터">
            <Select
              value={quickRange}
              onChange={(value) => setQuickRange(value as QuickRange)}
              style={{ width: 140 }}
              options={Object.entries(quickRangeLabels).map(([key, label]) => ({
                value: key,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item label="검색">
            <Input
              placeholder="거래 ID, 주문번호, 고객 ID"
              prefix={<SearchOutlined />}
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="상태">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "전체" },
                { value: "approved", label: "승인" },
                { value: "pending", label: "대기" },
                { value: "failed", label: "실패" },
                { value: "cancelled", label: "취소" },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button icon={<FilterOutlined />} onClick={openAdvancedFilters}>
              고급 필터
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <DataTable
          data={pagedData}
          exportData={sortedData}
          caption="거래 내역 목록"
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={{
            pageIndex,
            pageSize,
            total: sortedData.length,
            onChange: (nextPageIndex, nextPageSize) => {
              setPageIndex(nextPageIndex);
              setPageSize(nextPageSize);
            },
          }}
          exportFileName="transactions"
        />
      </Card>

      <Modal
        title="필터 저장"
        open={isSaveModalOpen}
        onCancel={() => setIsSaveModalOpen(false)}
        onOk={handleSaveFilter}
        okText="저장"
        cancelText="취소"
        focusTriggerAfterClose
      >
        <Form layout="vertical">
          <Form.Item label="필터 이름" required>
            <Input
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              placeholder="예: 최근 7일 승인 거래"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
