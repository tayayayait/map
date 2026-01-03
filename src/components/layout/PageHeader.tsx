import { Breadcrumb, Space, Typography } from "antd";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function PageHeader({ title, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb
            items={breadcrumbs.map((item) => ({
              title: item.href ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                item.label
              ),
            }))}
            style={{ marginBottom: 8 }}
          />
        )}
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
      </div>
      {actions && <Space>{actions}</Space>}
    </div>
  );
}
