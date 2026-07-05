# snapfeed — App Store 심사 제출 팩

> 2026-07-05 기준. 아래 텍스트는 App Store Connect에 그대로 복붙하면 되도록 글자수 제한에 맞춰 작성됨.
> (기존 `store-submission.md`의 iOS 섹션은 PWABuilder 시절 내용이라 이 문서가 대체함)

---

## 0. 제출 전 준비 (순서대로)

- [ ] **데모 계정 생성** — 앱에서 새로 가입: `sangmin082+review@gmail.com` / 비밀번호 아무거나(기록해둘 것).
      메일 확인 → 위저드로 아기 등록(이름 예: 데모아기) → **기록지 사진 1~2장 촬영해 기록 저장**
      (심사관이 손글씨 기록지가 없어도 기록/패턴 화면을 볼 수 있게 데이터를 미리 채워두는 것).
- [ ] **스크린샷 촬영** (아래 7번 리스트) — 본인 아이폰에서 캡처.
- [ ] **최종 빌드** — `v0.3.2` 태그로 새 빌드 (수출규정 자동답변 포함). 제출 시 이 빌드 선택.

---

## 1. 앱 정보 (App Information)

| 항목 | 값 |
|---|---|
| 이름 | snapfeed 수유기록 (생성 시 입력한 그대로) |
| 부제 (Subtitle, 30자) | `수첩 수유기록, 사진 한 장으로 정리` |
| 기본 카테고리 | 라이프스타일 (Lifestyle) |
| 보조 카테고리 | 건강 및 피트니스 |
| 콘텐츠 권한 | 제3자 콘텐츠 없음 |

## 2. 연령 등급 (Age Rating)

설문 전부 **"없음/아니요"** 선택 → **4+** 로 산정됨. (폭력·의료치료정보·도박 등 해당사항 없음)

## 3. 버전 정보 텍스트

**프로모션 텍스트** (170자 이내):
```
할머니·산후도우미가 수첩에 적어주신 수유 기록, 사진 한 장이면 끝. AI가 자동으로 읽어 기록하고, 수유량과 패턴을 한눈에 보여드립니다.
```

**설명** (4000자 이내):
```
손으로 적은 육아 수첩, 찰칵 한 번이면 기록 끝.

어르신이나 산후도우미가 수첩에 남겨주신 수유·배변·수면 기록을
사진 한 장으로 촬영하면, AI가 자동으로 읽어 디지털 기록으로 정리합니다.

◆ 이런 분들을 위해 만들었어요
· 돌봐주시는 분은 앱 입력이 번거로워 수첩에 손으로 적는 게 편하신 분
· 부모는 수유 간격·총량·패턴을 보고 싶은데 옮겨 적을 시간이 없는 분

◆ 주요 기능
· 사진 한 장으로 하루치 기록: 수유(분유·직수·유축), 소변·대변, 수면까지 한 번에
· 한국어 손글씨 그대로 인식: "분유 120", "소변 ✓", "正" 자 표기까지
· 자동 패턴 분석: 일일 총 수유량, 시간대 분포, 평균 수유 간격
· 수유 알림: 마지막 기록 기준으로 다음 수유 시간을 알려드려요
· 가족 함께 쓰기: 초대 링크 하나로 배우자·조부모님과 같은 기록을 공유
· 원본 사진 보관: 인식 결과와 원본을 함께 확인

◆ 개인정보
업로드한 사진은 기록 인식 목적으로만 사용됩니다.
앱 내에서 언제든 계정과 모든 데이터를 삭제할 수 있습니다.
```

**키워드** (100자 이내, 쉼표 구분·공백 없음):
```
수유기록,육아,아기,수유,분유,기저귀,수면,신생아,육아일기,수유일지,산후도우미,아기기록,수유텀
```

| 항목 | 값 |
|---|---|
| 지원 URL | `https://snapfeed.sangmin082.workers.dev` |
| 마케팅 URL (선택) | 비워도 됨 |
| 개인정보처리방침 URL | `https://snapfeed.sangmin082.workers.dev/privacy` |
| 저작권 | `2026 Sangmin Kang` |

## 4. App Privacy 라벨 (Data Collection)

"데이터 수집" → **예** 선택 후:

| 데이터 유형 | 선택 | 세부 답변 |
|---|---|---|
| 연락처 정보 → **이메일 주소** | 수집함 | 사용자 신원과 **연결됨** / 앱 기능 목적 / 추적 **아니요** |
| 사용자 콘텐츠 → **사진 또는 비디오** | 수집함 | 연결됨 / 앱 기능 / 추적 아니요 |
| 사용자 콘텐츠 → **기타 사용자 콘텐츠** (수유·육아 기록) | 수집함 | 연결됨 / 앱 기능 / 추적 아니요 |
| 그 외 전부 (위치, 식별자, 진단, 검색기록 등) | 수집 안 함 | — |
| **추적(Tracking)에 사용됩니까?** | **아니요** | 광고/트래킹 SDK 없음 |

## 5. 심사 정보 (App Review Information)

| 항목 | 값 |
|---|---|
| 로그인 필요 | ✅ 체크 |
| 사용자 이름 | `sangmin082+review@gmail.com` (0번에서 만든 데모 계정) |
| 암호 | (데모 계정 비밀번호) |
| 연락처 | 강상민 / 전화번호 / sangmin082@gmail.com |

**심사 메모 (Notes)** — 영어 권장, 그대로 복붙:
```
snapfeed digitizes handwritten Korean baby-care journals. Caregivers
(grandparents, postpartum helpers) prefer writing feeding logs by hand;
parents photograph the page and the app's AI converts it into structured
feeding/diaper/sleep records with charts.

How to test:
1. Sign in with the demo account above (email/password).
2. The account is pre-populated with records — check 기록 (Records) and
   패턴 (Patterns) tabs to see parsed data and charts.
3. Camera flow: tap the center camera button. Photographing any handwritten
   feeding note (e.g. "6:30 분유 120 / 9:10 소변") will be parsed by AI.
   Uploaded photos are processed by Google's Gemini API solely for text
   extraction, as disclosed in our privacy policy.
4. Account deletion is available in-app: 설정 (Settings) → 계정 삭제.

The app requires a network connection (records sync to our backend).
```

## 6. 빌드 선택

- TestFlight에서 **최신 빌드(v0.3.2 이후)** 선택 — 수출규정 자동답변(ITSAppUsesNonExemptEncryption)이 포함된 빌드.

## 7. 스크린샷 (필수: 6.9" 또는 6.7" 1세트, 최소 3장 권장 5장)

본인 아이폰으로 아래 화면 캡처 (전원+볼륨업). 상태바에 민감정보 없게:

1. **홈** — 아기 카드 + "사진 찍어 기록하기" 버튼
2. **촬영 인식 결과** — 기록지 사진 → 표로 변환된 화면 (핵심 차별점!)
3. **기록 목록** — 일별 기록 + 원본 사진
4. **패턴** — DayClock/주간 차트
5. **환영 화면** — 수첩→자동정리 목업

업로드: App Store Connect → 버전 페이지 → 미리보기 및 스크린샷.
(크기 안 맞으면 업로드 시 거부 메시지로 알려줌 — 대부분 최신 아이폰 캡처는 그대로 통과)

## 8. 제출 순서

1. App Store Connect → snapfeed 수유기록 → **1.0 준비 중** 버전 페이지
2. 스크린샷 업로드 → 3번 텍스트 붙여넣기 → 빌드 선택
3. App Privacy(4번) · 심사 정보(5번) 입력
4. 연령등급(2번) · 카테고리(1번) 확인
5. **심사를 위해 제출** → 대기 (보통 24~48시간)

## 9. 리젝 대비 메모

| 예상 지적 | 대응 |
|---|---|
| 4.2 최소 기능(웹 래퍼) | 네이티브 카메라·로컬 수유 알림·Apple 로그인 탑재 — 심사 메모에 명시돼 있음 |
| 5.1.1 계정 삭제 | 설정 → 계정 삭제 구현됨 (메모에 경로 안내) |
| 2.1 로그인 불가 | 데모 계정 확인 — 제출 직전에 실제 로그인 되는지 한 번 테스트 |
| AI 생성 콘텐츠 고지 | /privacy에 Gemini 제3자 처리 명시됨 |

리젝 오면 Resolution Center 메시지 그대로 붙여넣어 주면 바로 대응.
