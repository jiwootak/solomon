import { NextResponse } from "next/server";

/**
 * GET /.well-known/assetlinks.json
 *
 * TWA(Trusted Web Activity) 가 Play Store 에서 실행될 때
 * 브라우저가 이 엔드포인트를 확인해 도메인 소유권을 검증한다.
 *
 * SHA-256 fingerprint 발급 방법:
 *   1. Google Play Console → 앱 → 설정 → 앱 서명
 *   2. "앱 서명 키 인증서" 섹션의 SHA-256 지문 복사
 *   3. PLAY_STORE_SHA256_CERT 환경변수에 설정 (콜론 포함 형식)
 *      예) AB:CD:EF:12:34:...
 *
 * 로컬 디버그용 SHA-256 발급:
 *   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
 */
export async function GET() {
  const sha256 = process.env.PLAY_STORE_SHA256_CERT;

  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: process.env.ANDROID_PACKAGE_NAME ?? "com.solomon.app",
        sha256_cert_fingerprints: sha256 ? [sha256] : [],
      },
    },
  ];

  return NextResponse.json(assetlinks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
