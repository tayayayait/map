import { Avatar, Card, List, Space, Tag, Typography } from "antd";
import {
  AlertOutlined,
  BellOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

const notifications: Notification[] = [
  { id: "1", title: "정산 완료", message: "2024년 1월 1주차 정산이 완료되었습니다.", type: "success", timestamp: "10분 전", read: false },
  { id: "2", title: "웹훅 전송 실패", message: "https://api.partner.com/webhooks 전송이 실패했습니다.", type: "error", timestamp: "32분 전", read: false },
  { id: "3", title: "사용자 초대 완료", message: "pending@example.com으로 초대 메일을 발송했습니다.", type: "info", timestamp: "1시간 전", read: false },
];

const typeConfig = {
  success: { color: "green", icon: <CreditCardOutlined /> },
  error: { color: "red", icon: <AlertOutlined /> },
  warning: { color: "gold", icon: <AlertOutlined /> },
  info: { color: "blue", icon: <BellOutlined /> },
};

export default function Notifications() {
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginBottom: 4 }}>
        알림 센터
      </Typography.Title>
      <Typography.Text type="secondary">
        시스템 알림과 이벤트를 확인합니다
      </Typography.Text>

      <Card style={{ marginTop: 16 }}>
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      background: "var(--color-bg-surface-secondary)",
                      color: typeConfig[item.type].color,
                    }}
                    icon={typeConfig[item.type].icon}
                  />
                }
                title={
                  <Space>
                    <span>{item.title}</span>
                    {!item.read && <Tag color="blue">NEW</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <Typography.Text type="secondary">
                      {item.message}
                    </Typography.Text>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {item.timestamp}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
