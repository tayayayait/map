import { useCallback, useEffect, useRef } from "react";

export interface IdleTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  onWarn?: () => void;
  onTimeout?: () => void;
  onActivity?: () => void;
  events?: string[];
  disabled?: boolean;
  ignoreActivity?: boolean;
}

const DEFAULT_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "focus",
];

export const useIdleTimeout = ({
  timeoutMs = 15 * 60 * 1000,
  warningMs = 60 * 1000,
  onWarn,
  onTimeout,
  onActivity,
  events = DEFAULT_EVENTS,
  disabled = false,
  ignoreActivity = false,
}: IdleTimeoutOptions) => {
  const warnTimerRef = useRef<number | null>(null);
  const timeoutTimerRef = useRef<number | null>(null);
  const warnedRef = useRef(false);
  const ignoreActivityRef = useRef(ignoreActivity);

  useEffect(() => {
    ignoreActivityRef.current = ignoreActivity;
  }, [ignoreActivity]);

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) {
      window.clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      window.clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    if (disabled) return;

    const warnAt = Math.max(0, timeoutMs - warningMs);
    if (warningMs > 0 && warnAt > 0) {
      warnTimerRef.current = window.setTimeout(() => {
        warnedRef.current = true;
        onWarn?.();
      }, warnAt);
    }

    timeoutTimerRef.current = window.setTimeout(() => {
      warnedRef.current = false;
      onTimeout?.();
    }, timeoutMs);
  }, [clearTimers, disabled, onTimeout, onWarn, timeoutMs, warningMs]);

  const reset = useCallback(() => {
    if (disabled) return;
    warnedRef.current = false;
    onActivity?.();
    startTimers();
  }, [disabled, onActivity, startTimers]);

  useEffect(() => {
    if (disabled) return undefined;
    startTimers();

    const handleActivity = () => {
      if (ignoreActivityRef.current) return;
      reset();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [clearTimers, disabled, events, reset, startTimers]);

  return { reset };
};
