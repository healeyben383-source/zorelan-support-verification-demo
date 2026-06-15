import { permanentRedirect } from "next/navigation";

// RETIRED: the old scripted support-verification demo has been removed.
// The canonical structured execution-gate demo now lives at:
//   https://zorelan.com/demo
//
// A catch-all redirect in next.config.ts handles all routes at the platform
// level; this page-level redirect is a fallback for any environment where the
// config redirect is not applied.
export default function Page() {
  permanentRedirect("https://zorelan.com/demo");
}
