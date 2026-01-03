import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";

export type BreadcrumbItem = {
  label: string;
  path?: string;
};

export type AppRoute = {
  path: string;
  component: LazyExoticComponent<ComponentType>;
  label: string;
  breadcrumb: BreadcrumbItem[];
  permission: string;
  navGroup?: string;
  parentKey?: string;
};

const Index = lazy(() => import("@/pages/Index"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const TransactionDetail = lazy(() => import("@/pages/TransactionDetail"));
const Settlements = lazy(() => import("@/pages/Settlements"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const ApiKeys = lazy(() => import("@/pages/ApiKeys"));
const Webhooks = lazy(() => import("@/pages/Webhooks"));
const AuditLogs = lazy(() => import("@/pages/AuditLogs"));
const UsersSettings = lazy(() => import("@/pages/UsersSettings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export const routes: AppRoute[] = [
  {
    path: "/",
    component: Index,
    label: "대시보드",
    breadcrumb: [{ label: "대시보드", path: "/" }],
    permission: "dashboard.view",
    navGroup: "dashboard",
  },
  {
    path: "/transactions",
    component: Transactions,
    label: "거래 내역",
    breadcrumb: [
      { label: "거래 관리" },
      { label: "거래 내역", path: "/transactions" },
    ],
    permission: "transactions.view",
    navGroup: "transactions",
    parentKey: "transactions",
  },
  {
    path: "/transactions/:id",
    component: TransactionDetail,
    label: "거래 상세",
    breadcrumb: [
      { label: "거래 관리" },
      { label: "거래 상세" },
    ],
    permission: "transactions.view",
    navGroup: "transactions",
    parentKey: "transactions",
  },
  {
    path: "/settlements",
    component: Settlements,
    label: "정산 리포트",
    breadcrumb: [
      { label: "정산" },
      { label: "정산 리포트", path: "/settlements" },
    ],
    permission: "settlement.view",
    navGroup: "settlement",
    parentKey: "settlement",
  },
  {
    path: "/developer/api-keys",
    component: ApiKeys,
    label: "API Keys",
    breadcrumb: [
      { label: "개발자 설정" },
      { label: "API Keys", path: "/developer/api-keys" },
    ],
    permission: "developer.keys",
    navGroup: "developer",
    parentKey: "developer",
  },
  {
    path: "/developer/webhooks",
    component: Webhooks,
    label: "Webhooks",
    breadcrumb: [
      { label: "개발자 설정" },
      { label: "Webhooks", path: "/developer/webhooks" },
    ],
    permission: "developer.webhooks",
    navGroup: "developer",
    parentKey: "developer",
  },
  {
    path: "/notifications",
    component: Notifications,
    label: "알림 센터",
    breadcrumb: [
      { label: "시스템" },
      { label: "알림 센터", path: "/notifications" },
    ],
    permission: "system.notifications",
    navGroup: "system",
    parentKey: "system",
  },
  {
    path: "/audit-logs",
    component: AuditLogs,
    label: "감사 로그",
    breadcrumb: [
      { label: "시스템" },
      { label: "감사 로그", path: "/audit-logs" },
    ],
    permission: "system.audit",
    navGroup: "system",
    parentKey: "system",
  },
  {
    path: "/settings/users",
    component: UsersSettings,
    label: "사용자 및 권한",
    breadcrumb: [
      { label: "설정" },
      { label: "사용자 및 권한", path: "/settings/users" },
    ],
    permission: "settings.users",
    navGroup: "settings",
    parentKey: "settings",
  },
  {
    path: "*",
    component: NotFound,
    label: "페이지 없음",
    breadcrumb: [{ label: "페이지 없음" }],
    permission: "public",
  },
];
