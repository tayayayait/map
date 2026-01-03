import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Drawer, Layout, Menu, Space, Typography } from "antd";
import {
  ApiOutlined,
  AuditOutlined,
  BellOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  FileTextOutlined,
  KeyOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  TeamOutlined,
  ShopOutlined,
} from "@ant-design/icons";

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

const { Sider } = Layout;

const menuConfig = [
  { key: "dashboard", label: "대시보드", icon: <DashboardOutlined />, path: "/" },
  {
    key: "transactions",
    label: "거래 관리",
    icon: <CreditCardOutlined />,
    children: [
      { key: "transactions.list", label: "거래 내역", path: "/transactions" },
    ],
  },
  {
    key: "settlement",
    label: "정산",
    icon: <FileTextOutlined />,
    children: [
      {
        key: "settlement.reports",
        label: "정산 리포트",
        path: "/settlements",
      },
    ],
  },
  {
    key: "developer",
    label: "개발자 설정",
    icon: <ApiOutlined />,
    children: [
      {
        key: "developer.apiKeys",
        label: "API Keys",
        path: "/developer/api-keys",
        icon: <KeyOutlined />,
      },
      {
        key: "developer.webhooks",
        label: "Webhooks",
        path: "/developer/webhooks",
        icon: <LinkOutlined />,
      },
    ],
  },
  {
    key: "system",
    label: "시스템",
    icon: <BellOutlined />,
    children: [
      {
        key: "system.notifications",
        label: "알림 센터",
        path: "/notifications",
      },
      {
        key: "system.audit",
        label: "감사 로그",
        path: "/audit-logs",
        icon: <AuditOutlined />,
      },
    ],
  },
  {
    key: "settings",
    label: "설정",
    icon: <SettingOutlined />,
    children: [
      {
        key: "settings.users",
        label: "사용자 및 권한",
        path: "/settings/users",
        icon: <TeamOutlined />,
      },
    ],
  },
];

export function Sidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  isMobile,
}: SidebarProps) {
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState<string[]>(["transactions"]);

  const selectedKey = useMemo(() => {
    for (const item of menuConfig) {
      if (item.path && location.pathname === item.path) return item.key;
      for (const child of item.children ?? []) {
        if (child.path === location.pathname) return child.key;
      }
    }
    return "dashboard";
  }, [location.pathname]);

  const handleOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (!latestOpenKey) {
      setOpenKeys([]);
      return;
    }
    setOpenKeys([latestOpenKey]);
  };

  const buildMenuItems = () =>
    menuConfig.map((item) => {
      if (!item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: (
            <NavLink
              to={item.path!}
              aria-current={location.pathname === item.path ? "page" : undefined}
            >
              {item.label}
            </NavLink>
          ),
        };
      }
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: item.children.map((child) => ({
          key: child.key,
          icon: child.icon,
          label: (
            <NavLink
              to={child.path}
              aria-current={location.pathname === child.path ? "page" : undefined}
            >
              {child.label}
            </NavLink>
          ),
        })),
      };
    });

  const menu = (
    <Menu
      mode="inline"
      items={buildMenuItems()}
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      inlineCollapsed={collapsed && !isMobile}
      style={{ borderRight: 0 }}
    />
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        width={260}
        open={mobileOpen}
        onClose={() => onMobileOpenChange(false)}
        bodyStyle={{ padding: 0 }}
      >
        {menu}
      </Drawer>
    );
  }

  return (
    <Sider
      width={260}
      collapsedWidth={64}
      collapsed={collapsed}
      trigger={null}
      style={{
        background: "var(--color-bg-surface)",
        borderRight: "1px solid var(--color-border-default)",
        height: "calc(100vh - 56px)",
        position: "sticky",
        top: 56,
        overflow: "auto",
      }}
    >
      <div style={{ padding: "16px 12px", height: "100%" }}>
        <div style={{ flex: 1 }}>{menu}</div>
        <div
          style={{
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: 12,
            marginTop: 12,
          }}
        >
          {!collapsed && (
            <Space size={12} style={{ marginBottom: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--color-bg-surface-secondary)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <ShopOutlined />
              </div>
              <div>
                <Typography.Text strong>파트너주식회사</Typography.Text>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  MID: M12345678
                </div>
              </div>
            </Space>
          )}
          <Button
            type="text"
            block
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => onCollapsedChange(!collapsed)}
            aria-expanded={!collapsed}
          >
            {!collapsed && "접기"}
          </Button>
        </div>
      </div>
    </Sider>
  );
}
