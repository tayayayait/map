import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Grid, Layout } from "antd";
import { SkipLink } from "@/components/SkipLink";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { GlobalBanner } from "./GlobalBanner";
import { RightUtility } from "./RightUtility";
import { RightUtilityProvider, RightUtilityTab } from "./RightUtilityContext";

const { Content } = Layout;
const { useBreakpoint } = Grid;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const screens = useBreakpoint();
  const isMobile = useMemo(() => !screens.lg, [screens.lg]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rightUtilityOpen, setRightUtilityOpen] = useState(false);
  const [rightUtilityTab, setRightUtilityTab] = useState<RightUtilityTab>("filters");
  const [filtersContent, setFiltersContent] = useState<ReactNode>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const openRightUtility = (options?: { tab?: RightUtilityTab; filtersContent?: ReactNode }) => {
    if (options?.filtersContent !== undefined) {
      setFiltersContent(options.filtersContent);
    }
    if (options?.tab) {
      setRightUtilityTab(options.tab);
    }
    setRightUtilityOpen(true);
  };

  const closeRightUtility = () => setRightUtilityOpen(false);

  return (
    <RightUtilityProvider value={{ open: openRightUtility, close: closeRightUtility }}>
      <Layout style={{ minHeight: "100vh", background: "var(--color-bg-canvas)" }}>
        <SkipLink />
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onRightUtilityOpen={() => openRightUtility({ tab: "filters" })}
          theme={theme}
          onThemeChange={setTheme}
        />
        <Layout hasSider>
          <Sidebar
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
            isMobile={isMobile}
          />
          <Content
            style={{
              padding: isMobile ? "16px" : "24px",
              background: "transparent",
            }}
          >
            <GlobalBanner />
            <main
              id="main-content"
              tabIndex={-1}
              style={{ maxWidth: "1360px", margin: "0 auto" }}
            >
              {children}
            </main>
          </Content>
        </Layout>
        <RightUtility
          open={rightUtilityOpen}
          activeTab={rightUtilityTab}
          onTabChange={setRightUtilityTab}
          onClose={closeRightUtility}
          filtersContent={filtersContent}
        />
      </Layout>
    </RightUtilityProvider>
  );
}
