"use client";

import { useEffect } from "react";

const SW_PATH = "/sw-workshop.js";

/**
 * يسجّل service worker للورشة — مرة واحدة لكل جلسة متصفح.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      void navigator.serviceWorker
        .register(SW_PATH, { scope: "/" })
        .catch(() => {
          /* فشل التسجيل لا يعطّل التطبيق */
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
