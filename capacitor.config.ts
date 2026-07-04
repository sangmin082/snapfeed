import type { CapacitorConfig } from "@capacitor/cli";

// The app ships as a native shell that loads the live Cloudflare deployment in a
// WKWebView (the app can't be statically exported — it relies on SSR + server
// actions + the Cloudflare runtime). Point this at the production domain.
// Worker name is "snapfeed"; replace with the bound custom domain once decided.
const PROD_URL = "https://snapfeed.sangmin082.workers.dev";

const config: CapacitorConfig = {
  appId: "com.snapfeed.com",
  appName: "snapfeed",
  // Lets the server tell the native shell apart from plain browsers, so the
  // app skips the web marketing landing and gets an app-first flow.
  appendUserAgent: "SnapfeedApp",
  // No bundled web assets — we load PROD_URL remotely. This dir just needs to
  // exist for `cap sync`; keep a tiny offline fallback here.
  webDir: "capacitor/public",
  server: {
    url: PROD_URL,
    cleartext: false,
  },
  ios: {
    // Honor the safe-area insets the web layout already accounts for.
    contentInset: "never",
    backgroundColor: "#ffffff",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#fbbf24",
      showSpinner: false,
    },
  },
};

export default config;
