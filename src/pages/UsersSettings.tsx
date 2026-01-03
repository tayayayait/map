import { useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  MenuProps,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  MailOutlined,
  MoreOutlined,
  PlusOutlined,
  SafetyOutlined,
  SettingOutlined,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "viewer";
  status: "active" | "pending" | "inactive";
  lastLogin: string | null;
  invitedAt: string;
}

const users: User[] = [
  { id: "1", name: "김파트너", email: "partner@example.com", role: "owner", status: "active", lastLogin: "2024-01-03 15:45", invitedAt: "2023-12-01" },
  { id: "2", name: "이관리자", email: "admin@example.com", role: "admin", status: "active", lastLogin: "2024-01-03 14:30", invitedAt: "2023-12-15" },
  { id: "3", name: "박담당자", email: "viewer@example.com", role: "viewer", status: "active", lastLogin: "2024-01-02 10:20", invitedAt: "2024-01-01" },
  { id: "4", name: "-", email: "pending@example.com", role: "viewer", status: "pending", lastLogin: null, invitedAt: "2024-01-03" },
];

const roleConfig = {
  owner: { label: "오너", description: "모든 권한", color: "blue" },
  admin: { label: "관리자", description: "설정 변경 가능", color: "gold" },
  viewer: { label: "조회자", description: "읽기 전용", color: "default" },
};

const statusConfig = {
  active: { label: "활성", color: "green" },
  pending: { label: "초대 대기", color: "blue" },
  inactive: { label: "비활성", color: "default" },
};

export default function UsersSettings() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleInvite = () => {
    if (!inviteEmail) {
      message.error("이메일을 입력하세요.");
      return;
    }
    message.success(`${inviteEmail}로 초대 메일을 발송했습니다.`);
    setIsInviteOpen(false);
    setInviteEmail("");
    setInviteRole("viewer");
  };

  const handleDelete = () => {
    if (deleteConfirmText !== "삭제") {
      message.error("확인 텍스트가 일치하지 않습니다.");
      return;
    }
    message.success("사용자가 삭제되었습니다.");
    setDeleteConfirmUser(null);
    setDeleteConfirmText("");
  };

  const menuItems = (user: User): MenuProps["items"] => [
    {
      key: "role",
      label: (
        <Space>
          <SettingOutlined /> 역할 변경
        </Space>
      ),
      disabled: user.role === "owner",
    },
    user.status === "pending"
      ? {
          key: "resend",
          label: (
            <Space>
              <MailOutlined /> 초대 재발송
            </Space>
          ),
        }
      : null,
    { type: "divider" },
    {
      key: "delete",
      label: (
        <Space>
          <DeleteOutlined /> {user.role === "owner" ? "오너는 삭제 불가" : "삭제"}
        </Space>
      ),
      danger: true,
      disabled: user.role === "owner",
      onClick: () => user.role !== "owner" && setDeleteConfirmUser(user),
    },
  ].filter(Boolean) as MenuProps["items"];

  return (
    <div style={{ padding: 24 }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            사용자 및 권한
          </Typography.Title>
          <Typography.Text type="secondary">
            팀원을 초대하고 권한을 관리합니다
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsInviteOpen(true)}>
          사용자 초대
        </Button>
      </Space>

      <Space style={{ width: "100%", marginTop: 16 }} size={16}>
        {Object.entries(roleConfig).map(([key, config]) => (
          <Card key={key} style={{ flex: 1 }}>
            <Space>
              <Avatar icon={<SafetyOutlined />} />
              <div>
                <Typography.Text strong>{config.label}</Typography.Text>
                <div style={{ color: "var(--color-text-muted)" }}>
                  {config.description}
                </div>
              </div>
            </Space>
          </Card>
        ))}
      </Space>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid var(--color-border-default)",
              }}
            >
              <Space>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <Typography.Text strong>
                    {user.name === "-" ? "초대 대기중" : user.name}
                  </Typography.Text>
                  <div style={{ color: "var(--color-text-muted)" }}>{user.email}</div>
                </div>
              </Space>
              <Space size={12}>
                <Tag color={roleConfig[user.role].color}>
                  {roleConfig[user.role].label}
                </Tag>
                <Tag color={statusConfig[user.status].color}>
                  {statusConfig[user.status].label}
                </Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {user.lastLogin
                    ? `마지막 로그인 ${user.lastLogin}`
                    : `초대일 ${user.invitedAt}`}
                </Typography.Text>
                <Dropdown menu={{ items: menuItems(user) }} trigger={["click"]}>
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    aria-label="사용자 작업"
                  />
                </Dropdown>
              </Space>
            </div>
          ))}
        </Space>
      </Card>

      <Modal
        title="사용자 초대"
        open={isInviteOpen}
        onCancel={() => setIsInviteOpen(false)}
        onOk={handleInvite}
        okText="초대 발송"
        cancelText="취소"
        focusTriggerAfterClose
      >
        <Form layout="vertical">
          <Form.Item label="이메일" required>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="역할" required>
            <Select
              value={inviteRole}
              onChange={setInviteRole}
              options={[
                { value: "admin", label: "관리자" },
                { value: "viewer", label: "조회자" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="사용자 삭제"
        open={!!deleteConfirmUser}
        onCancel={() => {
          setDeleteConfirmUser(null);
          setDeleteConfirmText("");
        }}
        onOk={handleDelete}
        okText="삭제"
        okButtonProps={{ danger: true, disabled: deleteConfirmText !== "삭제" }}
        cancelText="취소"
        focusTriggerAfterClose
      >
        <Alert
          type="error"
          showIcon
          message={`삭제하려면 아래에 "삭제"를 입력하세요.`}
          style={{ marginBottom: 16 }}
        />
        <Form layout="vertical">
          <Form.Item label="확인 입력" required>
            <Input
              placeholder="삭제"
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
