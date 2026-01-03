import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Input,
  Layout,
  List,
  Space,
  Typography,
} from "antd";
import {
  BellOutlined,
  DownOutlined,
  MenuOutlined,
  SearchOutlined,
  SettingOutlined,
  SlidersOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
} from "@ant-design/icons";

interface TopbarProps {
  onMenuClick: () => void;
  onRightUtilityOpen: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

const { Header } = Layout;
const { useBreakpoint } = Grid;

const notifications = [
  {
    title: "정산 완료",
    message: "2024년 1월 1주차 정산이 완료되었습니다.",
    time: "2024-01-03 15:32 KST",
  },
  {
    title: "웹훅 전송 실패",
    message: "https://api.partner.com/webhooks 전송이 3회 실패했습니다.",
    time: "2024-01-03 14:20 KST",
  },
];

export function Topbar({
  onMenuClick,
  onRightUtilityOpen,
  theme,
  onThemeChange,
}: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = useMemo(() => !screens.md, [screens.md]);

  const envMenu = {
    items: [
      {
        key: "production",
        label: (
          <Space>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--color-status-success-fg)",
              }}
            />
            Production
          </Space>
        ),
      },
      {
        key: "sandbox",
        label: (
          <Space>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--color-status-warning-fg)",
              }}
            />
            Sandbox
          </Space>
        ),
      },
    ],
  };

  const profileMenu = {
    items: [
      { key: "account", label: "계정 설정" },
      { key: "help", label: "도움말" },
      { type: "divider" as const },
      { key: "logout", label: "로그아웃", danger: true },
    ],
  };

  return (
    <>
      <Header
        style={{
          height: 56,
          lineHeight: "56px",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Space size={16} align="center">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={onMenuClick}
                aria-label="메뉴 열기"
              />
            )}
            <Space size={12}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--color-brand-primary)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-text-inverse)",
                  fontWeight: 600,
                }}
              >
                P
              </div>
              <span style={{ fontWeight: 600 }}>PayConsole</span>
            </Space>

            <Dropdown menu={envMenu} trigger={["click"]}>
              <Button type="text">
                <Space>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "var(--color-status-success-fg)",
                    }}
                  />
                  <span>Production</span>
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          </Space>

          {!isMobile && (
            <div style={{ flex: 1, maxWidth: 520 }}>
              <Input
                placeholder="거래 검색 (거래 ID, 주문번호...)"
                prefix={<SearchOutlined />}
                allowClear
              />
            </div>
          )}

          <Space size={8} align="center">
            <Button
              type="text"
              icon={theme === "light" ? <BulbOutlined /> : <BulbFilled />}
              onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
              aria-label="테마 전환"
            />
            <Button
              type="text"
              icon={<SlidersOutlined />}
              onClick={onRightUtilityOpen}
              aria-label="유틸리티 열기"
            />
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => setNotificationsOpen(true)}
                aria-label="알림 열기"
              />
            </Badge>
            <Dropdown menu={profileMenu} trigger={["click"]}>
              <Button type="text">
                <Space>
                  <Avatar size={28} icon={<UserOutlined />} />
                  <span style={{ fontSize: 13 }}>김파트너</span>
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>

      <Drawer
        title="알림 센터"
        placement="right"
        width={360}
        onClose={() => setNotificationsOpen(false)}
        open={notificationsOpen}
      >
        <List
          dataSource={notifications}
          itemLayout="vertical"
          renderItem={(item) => (
            <List.Item>
              <Typography.Text strong>{item.title}</Typography.Text>
              <div style={{ marginTop: 4 }}>{item.message}</div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {item.time}
              </Typography.Text>
            </List.Item>
          )}
        />
        {!notifications.length && (
          <Typography.Text type="secondary">
            새로운 알림이 없습니다.
          </Typography.Text>
        )}
      </Drawer>
    </>
  );
}
