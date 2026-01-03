import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type RightUtilityTab = "filters" | "help" | "settings";

export type RightUtilityOpenOptions = {
  tab?: RightUtilityTab;
  filtersContent?: ReactNode;
};

export type RightUtilityContextValue = {
  open: (options?: RightUtilityOpenOptions) => void;
  close: () => void;
};

const RightUtilityContext = createContext<RightUtilityContextValue | null>(null);

export const RightUtilityProvider = RightUtilityContext.Provider;

export const useRightUtility = () => {
  const ctx = useContext(RightUtilityContext);
  if (!ctx) {
    throw new Error("useRightUtility must be used within RightUtilityProvider");
  }
  return ctx;
};
