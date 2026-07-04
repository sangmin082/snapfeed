# SnapFeed — iOS 앱스토어 출시 계획

> 결정 사항(2026-06-21): **Mac·Apple 개발자계정 둘 다 없음 / 로그인은 이메일·비번만 / 수익화 미정(일단 무료)**

## 핵심 전제 2가지

1. **이 앱은 정적 export가 불가능하다.** SSR · 서버 액션 · API 라우트 · Cloudflare 런타임(`getCloudflareContext`)에 강하게
   묶여 있어서, JS/HTML을 앱에 통째로 번들링할 수 없다. → **네이티브 셸(Capacitor)이 라이브 서버(Cloudflare 배포본)를
   WKWebView로 로드**하는 구조가 유일하게 현실적이다.
2. **이런 "웹을 감싸는" 앱의 최대 심사 리스크는 Apple Guideline 4.2 (Minimum Functionality)** — 순수 웹 래퍼는 리젝된다.
   따라서 계획의 절반은 "네이티브다움"을 만들어 4.2를 통과하는 데 쓴다.

---

## 0단계 — 계정 · 빌드 환경 (현재 둘 다 없음)

- **Apple Developer Program 등록** — 연 $99. 개인이면 즉시, 사업자면 D-U-N-S 번호 필요(수일 소요). → 자세한 절차는 부록 B 참고.
- **빌드 환경(택1)** — iOS는 Xcode(=macOS)가 필수인데 Mac이 없으므로:
  - **(A) 클라우드 Mac CI (추천)** — Codemagic 무료 티어 또는 GitHub Actions `macos` 러너에서 archive →
    App Store Connect 업로드. *Mac 없이 출시 가능.*
  - (B) Mac mini / 맥북 일시 사용, 또는 MacStadium 등 클라우드 Mac 임대.

## 1단계 — 아키텍처: Capacitor 셸 + 라이브 서버 로드

- 기존 Next.js 앱은 그대로 재사용(RN/Flutter 재작성 ❌).
- `@capacitor/ios` WKWebView가 프로덕션 Cloudflare URL을 로드한다 (`capacitor.config.ts`의 `server.url`).
- Supabase 이메일/비번 로그인은 WebView 쿠키로 동작 → 소셜을 안 넣기로 한 게 여기서 유리(OAuth 딥링크/Sign in with Apple 불필요).

## 2단계 — 4.2 통과용 네이티브 기능 (★ 합격의 핵심)

- **네이티브 카메라** (`@capacitor/camera`) — 수첩 촬영을 OS 카메라/사진앱 연동으로.
- **로컬 알림** (`@capacitor/local-notifications`) — 다음 수유 시간 리마인더. 육아앱에 가장 자연스러운 네이티브 가치.
- 스플래시/상태바/햅틱, 네트워크 끊김 시 네이티브 오프라인 처리.

## 3단계 — 웹 코드 변경 (이번 PR에서 진행)

- `lib/native.ts` — `isNativePlatform()` 감지 유틸 (Capacitor 전역 사용, SSR 안전).
- `PhotoUploader` — 네이티브면 Capacitor Camera, 웹이면 기존 `<input type=file>`.
- `lib/notifications.ts` + `FeedReminderButton` — 알림 권한 요청 + 수유 리마인더 스케줄.
- safe-area는 이미 적용됨(`env(safe-area-inset-*)`).

## 4단계 — 앱스토어 정책 필수 항목 (놓치면 리젝)

- **계정 삭제(in-app)** — Guideline 5.1.1(v) 의무. profile에 "계정 삭제" + 서버 액션으로 Supabase 유저/데이터 삭제. *없으면 100% 리젝.*
- **개인정보처리방침 페이지** — `/privacy`. 특히 업로드 사진이 **제3자 AI(Google Gemini)** 로 처리됨을 명시.
- **App Privacy 라벨** (App Store Connect) — 사진/계정/사용데이터 수집 신고.
- **Info.plist 권한 문구** — `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, 알림 사유.
- **수익화: 무료라 IAP 불필요.** 추후 유료/구독 전환 시 반드시 Apple IAP(외부 결제 링크 금지). 지금 외부 결제 코드 넣지 말 것.

## 5단계 — iOS 프로젝트 셋업 (Mac에서)

```bash
npx cap add ios        # ios/ 네이티브 프로젝트 생성 (CocoaPods 필요 → Mac)
npx cap sync ios       # 웹 자산/플러그인 동기화
npx cap open ios       # Xcode 열기
```

- Bundle ID(예: `com.sangmin.snapfeed`), 앱 이름, 버전/빌드 번호.
- 아이콘(`public/icon-source.svg`에서 전 사이즈 생성), 런치스크린/스플래시.
- `Info.plist`에 권한 문구 추가, Xcode 자동 서명.

## 6단계 — 빌드 & TestFlight

- 클라우드 Mac CI에서 archive → App Store Connect 업로드 → **TestFlight 내부 테스트**(카메라·알림·로그인 실기기 검증).

## 7단계 — 심사 제출물

- 스크린샷(6.9"/6.7" 필수, 한국어), 설명·키워드, 지원/방침 URL, 연령등급.
- **심사용 데모 계정 제공(필수)** — 로그인 게이트 앱이라 리뷰어 계정 없으면 즉시 리젝.
- 심사 메모: "어르신·산후도우미가 수기로 적은 수유 기록 사진을 AI로 디지털화하는 앱" + 데모 계정.

---

## 심사 리스크 요약

| 리스크 | 대응 | 단계 |
|---|---|---|
| 4.2 웹 래퍼 리젝 | 네이티브 카메라 + 로컬 알림 + 오프라인 | 2·3 |
| 계정삭제 누락 (5.1.1(v)) | in-app 계정 삭제 | 4 |
| 데모계정 미제공 | 심사 메모에 포함 | 7 |
| Mac 부재 | 클라우드 Mac CI | 0 |
| AI 데이터 고지 누락 | /privacy에 Gemini 명시 | 4 |

## 예상 일정

계정·CI 셋업 수일 + 개발(카메라·알림·계정삭제·방침) 1~2주 + 심사 대기 평균 1~3일(첫 제출 리젝 1회 각오).

---

## 알려진 엣지 케이스 / 후속 작업

- **공유 아기 데이터 삭제**: `babies.created_by ... on delete cascade`라, 계정 삭제 시 그 사람이 만든 아기와 기록이 공동
  보호자에게도 사라질 수 있다. v1은 단순 삭제로 가고, 추후 "마지막 멤버일 때만 아기 삭제 / 아니면 created_by 이관" 로직 필요.
- **스토리지 GC**: 계정 삭제 시 DB는 cascade로 지워지나 Storage 객체(프로필/기록 사진)는 best-effort 정리. 주기적 orphan
  정리 잡 검토.
- **server.url 고정 로드**: 오프라인 시 빈 화면 방지용 네이티브 오프라인 폴백 화면 필요.

---

## 부록 A — capacitor.config.ts 의 server.url

`server.url`은 프로덕션 도메인으로 설정해야 한다. 워커 이름은 `snapfeed`이므로 `https://snapfeed.<account>.workers.dev`
또는 연결된 커스텀 도메인. 배포 도메인 확정 후 `capacitor.config.ts`의 `PROD_URL`을 교체할 것.

## 부록 B — Apple 개발자 등록 절차 (B 질문 대비)

1. https://developer.apple.com/programs/ → "Enroll".
2. Apple ID 로그인(2단계 인증 필수) → Apple Developer 앱(iPhone) 또는 웹에서 진행.
3. 개인(Individual) vs 조직(Organization) 선택:
   - 개인: 즉시 가능, 판매자명 = 본인 실명.
   - 조직: D-U-N-S 번호 필요(무료 발급, 며칠), 판매자명 = 법인명.
4. 연 $99 결제 → 보통 24~48시간 내 승인.
5. 승인 후 App Store Connect(https://appstoreconnect.apple.com)에서 앱 레코드 생성.
6. 세금/금융(유료 앱일 때만) — 무료라 생략 가능, 단 Agreements의 무료앱 계약은 동의 필요.
