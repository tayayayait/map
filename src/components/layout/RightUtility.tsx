import type { ReactNode } from "react";
import { Drawer, Tabs } from "antd";
import type { RightUtilityTab } from "./RightUtilityContext";

interface RightUtilityProps {
  open: boolean;
  onClose: () => void;
  activeTab: RightUtilityTab;
  onTabChange: (tab: RightUtilityTab) => void;
  filtersContent?: ReactNode;
}

export function RightUtility({
  open,
  onClose,
  activeTab,
  onTabChange,
  filtersContent,
}: RightUtilityProps) {
  return (
    <Drawer
      title="유틸리티"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as RightUtilityTab)}
        items={[
          {
            key: "filters",
            label: "필터",
            children:
              filtersContent ??
              "고급 필터 영역(거래/감사 로그 등)으로 사용됩니다.",
          },
          {
            key: "help",
            label: "도움말",
            children: "사용 가이드와 FAQ를 표시합니다.",
          },
          {
            key: "settings",
            label: "설정",
            children: "개인 설정 및 환경 설정을 관리합니다.",
          },
        ]}
      />
    </Drawer>
  );
}
