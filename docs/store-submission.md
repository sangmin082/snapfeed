# Play Store / App Store 등록 가이드

snapfeed는 PWA로, 네이티브 코드 없이 두 스토어에 등록할 수 있습니다.

- **Google Play**: TWA(Trusted Web Activity)로 패키징 — [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) 또는 [PWABuilder](https://www.pwabuilder.com)
- **App Store**: WKWebView 래퍼로 패키징 — [PWABuilder](https://www.pwabuilder.com) iOS 패키지 (Xcode + Apple Developer 계정 필요)

## 저장소에 이미 갖춰진 것

| 요건 | 위치 |
| --- | --- |
| Web App Manifest (id, 아이콘, 스크린샷, 바로가기) | `app/manifest.ts` → `/manifest.webmanifest` |
| 서비스 워커 + 오프라인 폴백 | `public/sw.js`, `public/offline.html`, 등록은 `components/ServiceWorkerRegister.tsx` |
| maskable 아이콘 (Android 적응형 아이콘) | `public/icon-{192,512}-maskable.png` |
| Digital Asset Links (Play TWA 검증) | `app/.well-known/assetlinks.json/route.ts` — env로 활성화 |
| Apple App Site Association (iOS 유니버설 링크) | `app/.well-known/apple-app-site-association/route.ts` — env로 활성화 |
| SW 캐시 무효화 헤더 | `public/_headers` |

`.well-known` 라우트 두 개는 아래 환경변수가 설정되기 전까지 404를 반환합니다(의도된 동작).

## 1. Google Play (TWA)

### 1-1. 패키지 생성

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://<배포-도메인>/manifest.webmanifest
# packageId 예시: app.snapfeed.twa (한 번 정하면 변경 불가)
bubblewrap build   # → app-release-signed.aab + 서명 키(android.keystore)
```

PWABuilder를 쓰는 경우: pwabuilder.com에 배포 URL 입력 → Android 패키지 다운로드.

### 1-2. assetlinks 활성화 (주소창 숨김에 필수)

서명 인증서의 SHA-256 지문을 구한 뒤:

```bash
# 로컬 키 지문
keytool -list -v -keystore android.keystore | grep SHA256
```

`wrangler.jsonc`의 `vars`(또는 Cloudflare 대시보드)에 설정하고 재배포:

```jsonc
"vars": {
  "ANDROID_PACKAGE_NAME": "app.snapfeed.twa",
  "ANDROID_SHA256_FINGERPRINTS": "AA:BB:...:ZZ"
}
```

> **중요**: Play Console에 업로드하면 **Play App Signing**이 앱을 다시 서명합니다.
> Play Console → 설정 → 앱 무결성 → 앱 서명 인증서의 SHA-256 지문을
> `ANDROID_SHA256_FINGERPRINTS`에 **쉼표로 추가**해야 실기기에서 주소창이 사라집니다.

배포 후 확인: `https://<도메인>/.well-known/assetlinks.json` 이 JSON을 반환해야 하고,
[Statement List Tester](https://developers.google.com/digital-asset-links/tools/generator)로 검증할 수 있습니다.

### 1-3. Play Console 제출

1. [Play Console](https://play.google.com/console)에서 앱 생성 (등록비 $25, 1회)
2. `.aab` 업로드 → 내부 테스트 트랙부터 시작 권장
3. 스토어 등록정보: 스크린샷은 `public/screenshot-narrow.png`(1080×1920)를 그대로 쓰거나 실기기 캡처 사용
4. 데이터 보안 양식: 계정 정보(이메일), 사진(수첩 사진), 건강 관련 기록(수유·체중) 수집을 신고
5. 개인정보처리방침 URL: `https://<도메인>/privacy`

## 2. App Store (iOS 래퍼)

Apple은 순수 PWA를 직접 받지 않으므로 WKWebView 래퍼로 제출합니다.

### 2-1. 패키지 생성

1. [pwabuilder.com](https://www.pwabuilder.com)에 배포 URL 입력 → **iOS** 패키지 다운로드 (Xcode 프로젝트)
2. Xcode에서 열고 Bundle ID(예: `app.snapfeed.ios`)와 팀 설정
3. Apple Developer Program 가입 필요 (연 $99)

### 2-2. 유니버설 링크 (선택이지만 권장)

`wrangler.jsonc`의 `vars`에 설정하고 재배포:

```jsonc
"vars": {
  "APPLE_APP_ID": "<TEAM_ID>.app.snapfeed.ios"
}
```

확인: `https://<도메인>/.well-known/apple-app-site-association` 이 JSON을 반환해야 합니다.

### 2-3. App Store Connect 제출

1. App Store Connect에서 앱 생성 → Xcode에서 Archive → Upload
2. **심사 대비(4.2 최소 기능성 거절 방지)**: 웹사이트 그대로가 아니라 "앱다운" 요소를 설명하세요
   — 홈 화면 설치, 오프라인 폴백, 카메라 기반 업로드 플로우가 근거가 됩니다
3. 로그인 심사용 데모 계정을 심사 노트에 첨부
4. 개인정보처리방침 URL: `https://<도메인>/privacy`, 이용약관: `https://<도메인>/terms`
5. **계정 삭제 요건**: 앱 내 계정 삭제가 이미 구현되어 있음 (`components/DeleteAccountSection.tsx`) — 심사 노트에 경로(프로필 → 계정 삭제)를 명시

## 3. 배포 전 체크리스트

- [ ] `pnpm deploy` 후 `https://<도메인>/manifest.webmanifest` 정상 응답
- [ ] `https://<도메인>/sw.js` 정상 응답 (Cache-Control: no-cache)
- [ ] Chrome DevTools → Application → Manifest에 경고 없음 (Lighthouse PWA 감사 통과)
- [ ] `assetlinks.json` / `apple-app-site-association` env 설정 후 200 응답
- [ ] 오프라인 상태에서 방문 시 `offline.html` 폴백 표시
