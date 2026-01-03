import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/ko";

dayjs.extend(utc);
dayjs.extend(timezone);

export type CurrencyCode = "KRW" | "USD";

const currencyDigits: Record<CurrencyCode, number> = {
  KRW: 0,
  USD: 2,
};

export const roundCurrency = (amount: number, currency: CurrencyCode) => {
  const digits = currencyDigits[currency];
  const factor = 10 ** digits;
  return Math.round(amount * factor) / factor;
};

export const formatCurrency = (
  amount: number,
  currency: CurrencyCode,
  locale: "ko-KR" | "en-US" = "ko-KR",
) => {
  const digits = currencyDigits[currency];
  const rounded = roundCurrency(amount, currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(rounded);
};

export const formatNumber = (
  value: number,
  locale: "ko-KR" | "en-US" = "ko-KR",
) =>
  new Intl.NumberFormat(locale).format(value);

const KST_TZ = "Asia/Seoul";

export const formatDateTimeKST = (
  value: Date | string | number,
  locale: "ko" | "en" = "ko",
  withTimezoneLabel = true,
) => {
  const base = dayjs(value).tz(KST_TZ);
  const pattern =
    locale === "ko" ? "YYYY년 M월 D일 (ddd) HH:mm" : "MMM D, YYYY hh:mm a";
  const formatted = base.locale(locale).format(pattern);
  return withTimezoneLabel ? `${formatted} KST` : formatted;
};
