import { useId, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Pagination,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  CaretDownOutlined,
  CaretUpOutlined,
  DownloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

type PaginationState = {
  pageIndex: number;
  pageSize: number;
  total: number;
  onChange: (pageIndex: number, pageSize: number) => void;
};

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  exportData?: TData[];
  caption?: string;
  ariaLiveText?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  pagination?: PaginationState;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  height?: number;
  exportFileName?: string;
  enableExport?: boolean;
  getRowId?: (row: TData, index: number) => string;
}

type ColumnMeta = {
  exportable?: boolean;
};

const escapeCsvValue = (value: unknown) => {
  const stringValue = value === null || value === undefined ? "" : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

const getHeaderLabel = (header: unknown, fallback: string) => {
  if (typeof header === "string") return header;
  if (typeof header === "number") return String(header);
  return fallback;
};

export function DataTable<TData>({
  data,
  columns,
  exportData,
  caption,
  ariaLiveText,
  loading,
  error,
  onRetry,
  pagination,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledFilters,
  onColumnFiltersChange,
  height = 520,
  exportFileName = "data-table",
  enableExport = true,
  getRowId,
}: DataTableProps<TData>) {
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [filterState, setFilterState] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnPinning, setColumnPinning] = useState<{ left?: string[]; right?: string[] }>(
    {},
  );
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});

  const sorting = controlledSorting ?? sortingState;
  const filters = controlledFilters ?? filterState;

  const manualSorting = Boolean(onSortingChange);
  const manualFiltering = Boolean(onColumnFiltersChange);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters: filters,
      columnVisibility,
      columnPinning,
      columnSizing,
    },
    getRowId,
    onSortingChange: onSortingChange ?? setSortingState,
    onColumnFiltersChange: onColumnFiltersChange ?? setFilterState,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnPinning: true,
    columnResizeMode: "onChange",
  });

  const rows = table.getRowModel().rows;
  const captionId = useId();
  const liveRegionId = useId();
  const totalCount = pagination?.total ?? rows.length;
  const captionText = caption ?? "데이터 테이블";
  const liveMessage =
    ariaLiveText ?? `총 ${totalCount}건 중 ${rows.length}건 표시`;
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  const visibleColumns = table.getVisibleLeafColumns();
  const exportableColumns = visibleColumns.filter(
    (column) => (column.columnDef.meta as ColumnMeta | undefined)?.exportable !== false,
  );

  const exportRows = useMemo(() => {
    if (exportData && exportData.length > 0) {
      return exportData.map((row, index) =>
        exportableColumns.map((col) => {
          const accessorFn = col.columnDef.accessorFn;
          if (accessorFn) return accessorFn(row, index);
          const accessorKey = col.columnDef.accessorKey;
          if (accessorKey) {
            return (row as Record<string, unknown>)[String(accessorKey)];
          }
          return (row as Record<string, unknown>)[col.id];
        }),
      );
    }
    return table.getRowModel().rows.map((row) =>
      exportableColumns.map((col) => row.getValue(col.id)),
    );
  }, [table, exportableColumns, exportData]);

  const handleExportCsv = () => {
    const headers = exportableColumns.map((col) =>
      getHeaderLabel(col.columnDef.header, col.id),
    );
    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...exportRows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");
    const blob = new Blob([`\ufeff${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = async () => {
    const XLSX = await import("xlsx");
    const headers = exportableColumns.map((col) =>
      getHeaderLabel(col.columnDef.header, col.id),
    );
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
  };

  const columnSettingsContent = (
    <div style={{ padding: 12, minWidth: 240 }}>
      <Typography.Text type="secondary">컬럼 표시</Typography.Text>
      <div style={{ marginTop: 8 }}>
        {table
          .getAllLeafColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            const headerLabel = getHeaderLabel(column.columnDef.header, column.id);
            return (
              <Space
                key={column.id}
                align="center"
                style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}
              >
                <Checkbox
                  checked={column.getIsVisible()}
                  onChange={(event) => column.toggleVisibility(event.target.checked)}
                >
                  {headerLabel}
                </Checkbox>
                <Select
                  size="small"
                  value={column.getIsPinned() || "none"}
                  onChange={(value) => column.pin(value === "none" ? false : value)}
                  options={[
                    { value: "none", label: "고정 없음" },
                    { value: "left", label: "왼쪽 고정" },
                    { value: "right", label: "오른쪽 고정" },
                  ]}
                />
              </Space>
            );
          })}
      </div>
    </div>
  );

  const exportMenu = {
    items: [
      { key: "csv", label: "CSV 내보내기", onClick: handleExportCsv },
      { key: "xlsx", label: "XLSX 내보내기", onClick: handleExportXlsx },
    ],
  };

  const getPinningStyles = (columnId: string, position?: "header" | "cell") => {
    const column = table.getColumn(columnId);
    if (!column) return {};
    const pinned = column.getIsPinned();
    if (!pinned) return {};
    const isLeft = pinned === "left";
    const offset = isLeft ? column.getStart("left") : column.getAfter("right");
    return {
      position: "sticky" as const,
      [isLeft ? "left" : "right"]: offset,
      zIndex: position === "header" ? 3 : 2,
      background: "var(--color-bg-surface)",
      boxShadow: isLeft
        ? "2px 0 4px rgba(0,0,0,0.06)"
        : "-2px 0 4px rgba(0,0,0,0.06)",
    };
  };

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}>
        <Space>
          <Dropdown dropdownRender={() => columnSettingsContent} trigger={["click"]}>
            <Button icon={<SettingOutlined />}>컬럼 설정</Button>
          </Dropdown>
        </Space>
        {enableExport && (
          <Dropdown menu={exportMenu}>
            <Button icon={<DownloadOutlined />}>내보내기</Button>
          </Dropdown>
        )}
      </Space>

      <div className="sr-only" id={captionId}>
        {captionText}
      </div>
      <div className="sr-only" id={liveRegionId} aria-live="polite">
        {liveMessage}
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          action={onRetry ? <Button onClick={onRetry}>다시 시도</Button> : undefined}
          style={{ marginBottom: 12 }}
        />
      )}

      <div
        ref={tableContainerRef}
        role="region"
        aria-labelledby={captionId}
        style={{
          border: "1px solid var(--color-border-default)",
          borderRadius: 12,
          overflow: "auto",
          height,
          background: "var(--color-bg-surface)",
        }}
      >
        <div
          role="table"
          aria-describedby={captionId}
          aria-colcount={visibleColumns.length}
          aria-rowcount={rows.length}
          style={{ width: table.getTotalSize() }}
        >
          <div
            role="rowgroup"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              background: "var(--color-bg-surface-secondary)",
              borderBottom: "1px solid var(--color-border-default)",
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} role="row" style={{ display: "flex" }}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <div
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        padding: "12px 12px",
                        fontWeight: 600,
                        position: "relative",
                        cursor: isSortable ? "pointer" : "default",
                        borderRight: "1px solid var(--color-border-default)",
                        ...getPinningStyles(header.column.id, "header"),
                      }}
                      role="columnheader"
                      aria-sort={
                        isSortable
                          ? sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                      onClick={
                        isSortable ? header.column.getToggleSortingHandler() : undefined
                      }
                    >
                      <Space size={6}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {sorted === "asc" && <CaretUpOutlined />}
                        {sorted === "desc" && <CaretDownOutlined />}
                      </Space>
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            height: "100%",
                            width: 6,
                            cursor: "col-resize",
                            userSelect: "none",
                            touchAction: "none",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 24, display: "grid", placeItems: "center" }}>
              <Spin />
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 24 }}>
              <Empty description="데이터가 없습니다." />
            </div>
          ) : (
            <div role="rowgroup">
              {paddingTop > 0 && <div style={{ height: paddingTop }} />}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    role="row"
                    style={{
                      display: "flex",
                      borderBottom: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-surface)",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        role="cell"
                        style={{
                          width: cell.column.getSize(),
                          padding: "12px 12px",
                          borderRight: "1px solid var(--color-border-default)",
                          ...getPinningStyles(cell.column.id, "cell"),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                );
              })}
              {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
            </div>
          )}
        </div>
      </div>

      {pagination && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <Pagination
            current={pagination.pageIndex + 1}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            onChange={(page, pageSize) => pagination.onChange(page - 1, pageSize)}
            showTotal={(total, range) => `${range[0]}-${range[1]} / 총 ${total}건`}
          />
        </div>
      )}
    </div>
  );
}
