import { Suspense, useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider, Modal, Skeleton, Typography } from "antd";
import koKR from "antd/locale/ko_KR";
import { IntlProvider } from "react-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { appTheme } from "@/lib/antdTheme";
import { appDefaultLocale, defaultLocale, getMessages, normalizeLocale } from "@/lib/i18n";
import { routes } from "@/routes/routes";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import ErrorBoundary from "@/ErrorBoundary";

const queryClient = new QueryClient();
const locale = normalizeLocale(
  typeof navigator !== "undefined" ? navigator.language : appDefaultLocale,
);
const messages = getMessages(locale);

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const SESSION_WARNING_MS = 60 * 1000;
const SESSION_EXPIRED_KEY = "sessionExpiredAt";

function IdleSessionManager() {
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(SESSION_WARNING_MS / 1000),
  );
  const warningDeadlineRef = useRef<number | null>(null);

  const handleTimeout = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_EXPIRED_KEY, new Date().toISOString());
      window.location.assign("/login");
    }
    setWarningOpen(false);
  };

  const { reset } = useIdleTimeout({
    timeoutMs: SESSION_TIMEOUT_MS,
    warningMs: SESSION_WARNING_MS,
    onWarn: () => {
      warningDeadlineRef.current = Date.now() + SESSION_WARNING_MS;
      setSecondsLeft(Math.ceil(SESSION_WARNING_MS / 1000));
      setWarningOpen(true);
    },
    onTimeout: handleTimeout,
    ignoreActivity: warningOpen,
  });

  useEffect(() => {
    if (!warningOpen) return undefined;
    const timer = window.setInterval(() => {
      const deadline = warningDeadlineRef.current ?? Date.now();
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [warningOpen]);

  return (
    <Modal
      open={warningOpen}
      title="세션 만료 예정"
      okText="세션 연장"
      cancelText="로그아웃"
      closable={false}
      maskClosable={false}
      focusTriggerAfterClose
      onOk={() => {
        reset();
        setWarningOpen(false);
      }}
      onCancel={handleTimeout}
    >
      <Typography.Paragraph type="secondary">
        15분 동안 활동이 없어 자동 로그아웃됩니다.
      </Typography.Paragraph>
      <Typography.Text>
        {secondsLeft}초 내에 연장하지 않으면 로그아웃됩니다.
      </Typography.Text>
    </Modal>
  );
}

const App = () => (
  <ConfigProvider locale={koKR} direction="ltr" theme={appTheme}>
    <IntlProvider locale={locale} defaultLocale={defaultLocale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <IdleSessionManager />
        <BrowserRouter>
          <ErrorBoundary>
            <AppLayout>
              <Suspense
                fallback={
                  <div style={{ padding: "24px" }}>
                    <Skeleton active title paragraph={{ rows: 6 }} />
                    <Skeleton active title paragraph={{ rows: 6 }} />
                  </div>
                }
              >
                <Routes>
                  {routes.map((route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={<route.component />}
                    />
                  ))}
                </Routes>
              </Suspense>
            </AppLayout>
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </IntlProvider>
  </ConfigProvider>
);

export default App;
