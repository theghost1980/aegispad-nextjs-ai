"use client";

import { useEffect, useState } from "react";

interface BrowserInfo {
  isChrome: boolean;
  isBrave: boolean;
}

export function useBrowserDetection(): BrowserInfo {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isChrome: false,
    isBrave: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      const vendor = navigator.vendor;
      const detectedBrave = typeof (navigator as any).brave !== "undefined";
      const detectedChrome =
        !detectedBrave &&
        /Chrome\/[0-9.]+/.test(ua) &&
        !!vendor &&
        vendor.toLowerCase().includes("google inc.") &&
        !/Edg\/[0-9.]+/.test(ua) &&
        !/OPR\/[0-9.]+/.test(ua);

      setBrowserInfo({
        isChrome: detectedChrome,
        isBrave: detectedBrave,
      });
    }
  }, []);

  return browserInfo;
}
