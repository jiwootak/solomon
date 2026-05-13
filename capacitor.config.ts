import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.solomon.app",
  appName: "모두의 솔로몬",
  /**
   * 서버 URL 방식 — 빌드된 정적 파일 대신 배포된 웹 URL을 로드한다.
   * Supabase SSR 인증(쿠키 기반)이 그대로 동작하고,
   * 앱 업데이트 시 스토어 재심사 없이 즉시 반영된다.
   *
   * 로컬 개발 시: CAPACITOR_SERVER_URL 환경변수를 http://localhost:3000 으로 설정
   * 프로덕션:     Vercel 배포 URL 로 교체
   */
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? "https://your-domain.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: true,
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    StatusBar: {
      style: "Dark",
      backgroundColor: "#4F46E5",
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#4F46E5",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
