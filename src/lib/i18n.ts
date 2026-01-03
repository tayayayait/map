import { enMessages } from "@/i18n/en";
import { koMessages } from "@/i18n/ko";

export const supportedLocales = ["ko", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en";
export const appDefaultLocale: SupportedLocale = "ko";

const messagesByLocale: Record<SupportedLocale, Record<string, string>> = {
  en: enMessages,
  ko: koMessages,
};

export const normalizeLocale = (input?: string): SupportedLocale => {
  if (!input) return appDefaultLocale;
  const lowered = input.toLowerCase();
  if (lowered.startsWith("ko")) return "ko";
  if (lowered.startsWith("en")) return "en";
  return appDefaultLocale;
};

export const getMessages = (locale: SupportedLocale) => {
  if (locale === "en") return messagesByLocale.en;
  return { ...messagesByLocale.en, ...messagesByLocale.ko };
};
