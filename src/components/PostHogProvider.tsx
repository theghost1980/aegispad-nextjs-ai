"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog, { PostHogConfig } from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest";

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        debug: false,
        ui_host: "https://us.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
        disable_session_recording: true,
        autocapture: false,
        rageclick: false,
        performance_capture: {
          web_vitals: false,
        },
        dead_clicks: {
          __onCapture: undefined,
        },
        exception_autocapture: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
          capture_console_errors: true,
        },
        disable_external_dependency_loading: true,
        disable_surveys: true,
        disable_web_experiments: false,
      } as Partial<PostHogConfig>);
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "PostHog key (NEXT_PUBLIC_POSTHOG_KEY) not found. PostHog will not be initialized."
        );
      }
    }
  }, []);
  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += "?" + search;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}
