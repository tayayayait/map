import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ShopOutlined,
  StopOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "@/lib/format";

const transaction = {
  id: "TXN-20240103-001",
  orderId: "ORD-0103-001",
  status: "approved" as const,
  amount: 125000,
  currency: "KRW",
  method: "신용카드",
  cardInfo: {
    brand: "Visa",
    last4: "1234",
    issuer: "삼성카드",
  },
  customer: {
    id: "C001",
    name: "홍길동",
    email: "hong@example.com",
    phone: "010-****-5678",
  },
  merchant: {
    id: "M12345678",
    name: "파트너주식회사",
  },
  timestamps: {
    requested: "2024-01-03 15:32:40 KST",
    approved: "2024-01-03 15:32:45 KST",
  },
  metadata: {
    productName: "프리미엄 구독 (1개월)",
    description: "정기 결제",
  },
  timeline: [
    { time: "15:32:40", event: "결제 요청", status: "success" },
    { time: "15:32:42", event: "카드사 승인 요청", status: "success" },
    { time: "15:32:45", event: "결제 승인 완료", status: "success" },
  ],
};

const statusConfig = {
  approved: { label: "승인", color: "green", icon: <CheckCircleOutlined /> },
  pending: { label: "대기", color: "gold", icon: <ClockCircleOutlined /> },
  failed: { label: "실패", color: "red", icon: <CloseCircleOutlined /> },
  cancelled: { label: "취소", color: "default", icon: <StopOutlined /> },
};

export default function TransactionDetail() {
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label}가 복사되었습니다.`);
  };

  const handleCancel = () => {
    if (cancelConfirmText !== "취소") {
      message.error("확인 텍스트가 일치하지 않습니다.");
      return;
    }
    message.success("결제가 취소되었습니다.");
    setIsCancelModalOpen(false);
    setCancelConfirmText("");
  };

  const status = statusConfig[transaction.status];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Space align="center" size={12}>
            <Link to="/transactions">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                aria-label="거래 목록으로"
              />
            </Link>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {transaction.id}
            </Typography.Title>
            <Tag color={status.color} icon={status.icon}>
              {status.label}
            </Tag>
          </Space>
          <Typography.Text type="secondary">
            주문번호: {transaction.orderId}
          </Typography.Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />}>재시도</Button>
          <Button
            danger
            icon={<StopOutlined />}
            onClick={() => setIsCancelModalOpen(true)}
          >
            결제 취소
          </Button>
        </Space>
      </Space>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card>
              <Typography.Text type="secondary">결제 금액</Typography.Text>
              <Typography.Title level={2} style={{ margin: "4px 0" }}>
                {formatCurrency(transaction.amount, "KRW")}
              </Typography.Title>
              <Typography.Text type="secondary">
                {transaction.currency}
              </Typography.Text>
            </Card>

            <Card title={<Space><CreditCardOutlined /> 결제 수단</Space>}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="결제 방법">
                  {transaction.method}
                </Descriptions.Item>
                <Descriptions.Item label="카드 브랜드">
                  {transaction.cardInfo.brand}
                </Descriptions.Item>
                <Descriptions.Item label="카드 번호">
                  ****-****-****-{transaction.cardInfo.last4}
                </Descriptions.Item>
                <Descriptions.Item label="발급사">
                  {transaction.cardInfo.issuer}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<Space><UserOutlined /> 고객 정보</Space>}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="고객 ID">
                  {transaction.customer.id}
                </Descriptions.Item>
                <Descriptions.Item label="이름">
                  {transaction.customer.name}
                </Descriptions.Item>
                <Descriptions.Item label="이메일">
                  {transaction.customer.email}
                </Descriptions.Item>
                <Descriptions.Item label="연락처">
                  {transaction.customer.phone}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<Space><FileTextOutlined /> 주문 정보</Space>}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="상품명">
                  {transaction.metadata.productName}
                </Descriptions.Item>
                <Descriptions.Item label="설명">
                  {transaction.metadata.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card title="식별자">
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Typography.Text type="secondary">거래 ID</Typography.Text>
                  <Space style={{ marginTop: 4 }}>
                    <Typography.Text code>{transaction.id}</Typography.Text>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      aria-label="거래 ID 복사"
                      onClick={() => handleCopy(transaction.id, "거래 ID")}
                    />
                  </Space>
                </div>
                <div>
                  <Typography.Text type="secondary">주문번호</Typography.Text>
                  <Space style={{ marginTop: 4 }}>
                    <Typography.Text code>{transaction.orderId}</Typography.Text>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      aria-label="주문번호 복사"
                      onClick={() => handleCopy(transaction.orderId, "주문번호")}
                    />
                  </Space>
                </div>
              </Space>
            </Card>

            <Card title="처리 이력">
              <Timeline
                items={transaction.timeline.map((item) => ({
                  children: (
                    <div>
                      <Typography.Text strong>{item.event}</Typography.Text>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {item.time}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>

            <Card title={<Space><ShopOutlined /> 가맹점</Space>}>
              <Typography.Text strong>{transaction.merchant.name}</Typography.Text>
              <div>
                <Typography.Text type="secondary">
                  {transaction.merchant.id}
                </Typography.Text>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      <Modal
        title="결제 취소"
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        onOk={handleCancel}
        okText="결제 취소"
        okButtonProps={{ danger: true, disabled: cancelConfirmText !== "취소" }}
        cancelText="닫기"
        focusTriggerAfterClose
      >
        <Alert
          type="error"
          showIcon
          message={`${formatCurrency(transaction.amount, "KRW")} 결제를 취소하려면 아래에 "취소"를 입력하세요.`}
          style={{ marginBottom: 16 }}
        />
        <Form layout="vertical">
          <Form.Item label="확인 입력" required>
            <Input
              value={cancelConfirmText}
              onChange={(event) => setCancelConfirmText(event.target.value)}
              placeholder="취소"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
