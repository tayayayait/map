import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Select,
  Space,
  Steps,
  Typography,
  Upload,
  message,
} from "antd";
import type {
  RcFile,
  UploadFile,
  UploadProps,
  UploadRequestOption,
} from "antd/es/upload/interface";
import { UploadOutlined } from "@ant-design/icons";

const STEP_FIELDS: string[][] = [
  ["companyName", "businessNumber", "contactName", "contactEmail"],
  ["businessDocs"],
  ["bankName", "accountNumber", "accountHolder"],
  ["agree"],
];

const FILE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
const MAX_FILE_MB = 5;

const getFirstFieldKey = (fieldName: (string | number)[]) =>
  fieldName.length > 0 ? String(fieldName[0]) : "";

export default function KYB() {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadAttempts, setUploadAttempts] = useState<Record<string, number>>({});
  const [form] = Form.useForm();

  const fieldIdMap = useMemo(
    () => ({
      companyName: "kyb-company-name",
      businessNumber: "kyb-business-number",
      contactName: "kyb-contact-name",
      contactEmail: "kyb-contact-email",
      contactPhone: "kyb-contact-phone",
      businessDocs: "kyb-business-docs",
      bankName: "kyb-bank-name",
      accountNumber: "kyb-account-number",
      accountHolder: "kyb-account-holder",
      agree: "kyb-agree",
    }),
    [],
  );

  const focusField = (name: string) => {
    const targetId = fieldIdMap[name];
    if (!targetId) return;
    const el = document.getElementById(targetId) as HTMLElement | null;
    el?.focus();
  };

  const updateFileList = (next: UploadFile[]) => {
    setFileList(next);
    form.setFieldValue("businessDocs", next);
  };

  const runUpload = (
    rcFile: RcFile,
    callbacks?: Pick<UploadRequestOption, "onError" | "onSuccess" | "onProgress">,
  ) => {
    const onError = callbacks?.onError;
    const onSuccess = callbacks?.onSuccess;
    const onProgress = callbacks?.onProgress;
    const attempt = (uploadAttempts[rcFile.uid] ?? 0) + 1;
    setUploadAttempts((prev) => ({ ...prev, [rcFile.uid]: attempt }));

    let percent = 0;
    const shouldFail = rcFile.name.toLowerCase().includes("fail") && attempt === 1;

    const timer = window.setInterval(() => {
      percent = Math.min(100, percent + 20);
      onProgress?.({ percent });
      setFileList((prev) => {
        const next = prev.map((item) =>
          item.uid === rcFile.uid
            ? { ...item, percent, status: "uploading" }
            : item,
        );
        form.setFieldValue("businessDocs", next);
        return next;
      });
      if (percent >= 100) {
        window.clearInterval(timer);
        if (shouldFail) {
          onError?.(new Error("업로드 실패"));
          setFileList((prev) => {
            const next = prev.map((item) =>
              item.uid === rcFile.uid ? { ...item, status: "error" } : item,
            );
            form.setFieldValue("businessDocs", next);
            return next;
          });
          message.error("파일 업로드 실패. 재시도해주세요.");
        } else {
          onSuccess?.({}, rcFile);
          setFileList((prev) => {
            const next = prev.map((item) =>
              item.uid === rcFile.uid ? { ...item, status: "done" } : item,
            );
            form.setFieldValue("businessDocs", next);
            return next;
          });
        }
      }
    }, 200);
  };

  const handleUploadRequest: UploadProps["customRequest"] = ({
    file,
    onError,
    onSuccess,
    onProgress,
  }) => {
    runUpload(file as RcFile, { onError, onSuccess, onProgress });
  };

  const beforeUpload = (file: RcFile) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !FILE_EXTENSIONS.includes(extension)) {
      message.error("pdf/jpg/png 파일만 업로드할 수 있습니다.");
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > MAX_FILE_MB) {
      message.error("파일 크기는 5MB 이하만 가능합니다.");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleRetry = (file: UploadFile) => {
    setFileList((prev) => {
      const next = prev.map((item) =>
        item.uid === file.uid ? { ...item, status: "uploading", percent: 0 } : item,
      );
      form.setFieldValue("businessDocs", next);
      return next;
    });
    runUpload(file as RcFile);
  };

  const uploadProps: UploadProps = {
    id: fieldIdMap.businessDocs,
    multiple: true,
    fileList,
    beforeUpload,
    customRequest: handleUploadRequest,
    onChange(info) {
      updateFileList(info.fileList);
    },
    itemRender(originNode, file) {
      if (file.status !== "error") return originNode;
      return (
        <Space>
          {originNode}
          <Button size="small" onClick={() => handleRetry(file)}>
            재시도
          </Button>
        </Space>
      );
    },
  };

  const handleNext = async () => {
    try {
      await form.validateFields(STEP_FIELDS[currentStep]);
      setCurrentStep((prev) => Math.min(prev + 1, STEP_FIELDS.length - 1));
    } catch (error) {
      handleFormFinishFailed(error as { errorFields: { name: (string | number)[] }[] });
    }
  };

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSaveDraft = () => {
    message.success("임시 저장되었습니다.");
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      message.success("제출이 완료되었습니다.");
    } catch (error) {
      handleFormFinishFailed(error as { errorFields: { name: (string | number)[] }[] });
    }
  };

  const handleFormFinishFailed = ({
    errorFields,
  }: {
    errorFields: { name: (string | number)[] }[];
  }) => {
    if (!errorFields.length) return;
    const key = getFirstFieldKey(errorFields[0].name);
    if (!key) return;
    form.scrollToField(key, { behavior: "smooth", block: "center" });
    focusField(key);
  };

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            KYB 온보딩
          </Typography.Title>
          <Typography.Text type="secondary">
            사업자 정보를 제출하면 심사 후 승인 결과를 알려드립니다.
          </Typography.Text>
        </div>

        <Card>
          <Steps
            current={currentStep}
            items={[
              { title: "정보입력" },
              { title: "서류" },
              { title: "정산계좌" },
              { title: "제출" },
            ]}
          />
        </Card>

        <Form layout="vertical" form={form}>
          {currentStep === 0 && (
            <Card title="기본 정보">
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <Form.Item
                  label="업체명"
                  name="companyName"
                  rules={[{ required: true, message: "업체명을 입력하세요." }]}
                >
                  {(control, meta) => (
                    <Input
                      {...control}
                      id={fieldIdMap.companyName}
                      placeholder="예: 주식회사 멜로우"
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  label="사업자등록번호"
                  name="businessNumber"
                  rules={[{ required: true, message: "사업자등록번호를 입력하세요." }]}
                >
                  {(control, meta) => (
                    <Input
                      {...control}
                      id={fieldIdMap.businessNumber}
                      placeholder="예: 123-45-67890"
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  label="담당자명"
                  name="contactName"
                  rules={[{ required: true, message: "담당자명을 입력하세요." }]}
                >
                  {(control, meta) => (
                    <Input
                      {...control}
                      id={fieldIdMap.contactName}
                      placeholder="예: 홍길동"
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  label="담당자 이메일"
                  name="contactEmail"
                  rules={[
                    { required: true, message: "이메일을 입력하세요." },
                    { type: "email", message: "올바른 이메일 형식이 아닙니다." },
                  ]}
                >
                  {(control, meta) => (
                    <Input
                      {...control}
                      id={fieldIdMap.contactEmail}
                      placeholder="name@company.com"
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
                <Form.Item label="담당자 연락처 (선택)" name="contactPhone">
                  {(control, meta) => (
                    <Input
                      {...control}
                      id={fieldIdMap.contactPhone}
                      placeholder="예: 010-1234-5678"
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
              </Space>
            </Card>
          )}

          {currentStep === 1 && (
            <Card
              title="서류 제출"
              extra={<Typography.Text type="secondary">pdf/jpg/png, 최대 5MB</Typography.Text>}
            >
              <Form.Item
                label="사업자등록증"
                name="businessDocs"
                valuePropName="fileList"
                getValueFromEvent={(event) => event?.fileList}
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value || value.length === 0) {
                        return Promise.reject(new Error("서류를 업로드하세요."));
                      }
                      const hasUploading = value.some(
                        (item: UploadFile) => item.status === "uploading",
                      );
                      if (hasUploading) {
                        return Promise.reject(new Error("업로드 완료 후 진행하세요."));
                      }
                      const hasError = value.some(
                        (item: UploadFile) => item.status === "error",
                      );
                      if (hasError) {
                        return Promise.reject(new Error("업로드 실패 파일을 재시도하세요."));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Upload
                  {...uploadProps}
                  aria-invalid={form.getFieldError("businessDocs").length > 0}
                >
                  <Button icon={<UploadOutlined />}>파일 업로드</Button>
                </Upload>
              </Form.Item>
              <Alert
                type="info"
                showIcon
                message="업로드 진행상태가 완료되어야 다음 단계로 이동할 수 있습니다."
              />
            </Card>
          )}

          {currentStep === 2 && (
            <Card title="정산 계좌">
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <Form.Item
                  label="은행"
                  name="bankName"
                  rules={[{ required: true, message: "은행을 선택하세요." }]}
                >
                  {(control, meta) => (
                    <Select
                      {...control}
                      id={fieldIdMap.bankName}
                      placeholder="은행 선택"
                      options={[
                        { value: "kb", label: "국민은행" },
                        { value: "shinhan", label: "신한은행" },
                        { value: "woori", label: "우리은행" },
                        { value: "hana", label: "하나은행" },
                      ]}
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  label="계좌번호"
                  name="accountNumber"
                  rules={[{ required: true, message: "계좌번호를 입력하세요." }]}
                >
                  {(control, meta) => (
                    <Input
                      {...control}
                      id={fieldIdMap.accountNumber}
                      placeholder="예: 1234567890123"
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  label="예금주"
                  name="accountHolder"
                  rules={[{ required: true, message: "예금주명을 입력하세요." }]}
                >
                  {(control, meta) => (
                    <Input
                      {...control}
                      id={fieldIdMap.accountHolder}
                      placeholder="예: 주식회사 멜로우"
                      aria-invalid={meta.errors.length > 0}
                    />
                  )}
                </Form.Item>
              </Space>
            </Card>
          )}

          {currentStep === 3 && (
            <Card title="제출">
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Alert
                  type="warning"
                  showIcon
                  message="제출 후에는 심사가 시작되며 일부 정보는 수정할 수 없습니다."
                />
                <Form.Item
                  name="agree"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error("동의가 필요합니다.")),
                    },
                  ]}
                >
                  {(control, meta) => (
                    <Checkbox
                      {...control}
                      id={fieldIdMap.agree}
                      aria-invalid={meta.errors.length > 0}
                    >
                      제출 내용을 확인했으며 심사 안내에 동의합니다.
                    </Checkbox>
                  )}
                </Form.Item>
              </Space>
            </Card>
          )}
        </Form>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Button onClick={handleSaveDraft}>임시 저장</Button>
          <Space>
            <Button onClick={handlePrev} disabled={currentStep === 0}>
              이전
            </Button>
            {currentStep < STEP_FIELDS.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                다음
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit}>
                제출
              </Button>
            )}
          </Space>
        </Space>
      </Space>
    </div>
  );
}
