# 행사 등록 플랫폼

행사를 생성하고, 참가자가 URL로 접속해 등록할 수 있는 플랫폼입니다.
오프라인 / 온라인(웨비나) / 하이브리드 행사를 모두 지원합니다.

> 최종 조사 기준일: 2026-07-28. 코드베이스(app/, lib/, emails/, supabase/) 직접 확인 결과를 정리.

---

## 기술 스택

- **Next.js 16.2.7** (App Router) + **React 19.2.4** + TypeScript
- **Supabase**: DB, Auth, Realtime (`@supabase/supabase-js`, `@supabase/ssr`)
- **Resend** + `@react-email/components`: 이메일 발송/템플릿
- `qrcode` / `qrcode.react` / `html5-qrcode`: QR 생성 및 카메라 스캔
- `xlsx`: 참가자 명단 엑셀 내보내기
- `lucide-react`: 아이콘, `react-draggable`: 네임택 디자이너 드래그 배치
- 배포: Vercel, 리전 고정 `icn1`(서울)

---

## 1. 라우트 구조

### 공개 페이지
| 경로 | 역할 |
|---|---|
| `app/page.tsx` | 랜딩 페이지 |
| `app/[slug]/page.tsx` | 행사 상세/등록 폼. 60초 ISR(`unstable_cache`), SEO 메타데이터, 등록기간 전/후 분기 |
| `app/[slug]/live/page.tsx` | 웨비나 라이브 페이지(30초 revalidate). 채널 여러 개면 `ChannelViewer`, 없으면 `SingleLiveView`. `offline` 타입 행사는 404 |
| `app/attend/[registrationId]/page.tsx` | 참가자 개별 등록 확인 페이지 |
| `app/qr/[code]/route.ts` | QR 코드 리다이렉트: 스캔 카운트 증가 후 target_url로 302, 비활성 QR은 410 |

### 관리자 페이지
| 경로 | 역할 |
|---|---|
| `app/admin/login/page.tsx` | Supabase Auth 로그인 |
| `app/admin/page.tsx` | 행사 목록 + 전체 통계(행사수/등록/출석/현장등록/출석률). staff는 배정된 행사만 |
| `app/admin/events/new/page.tsx` | 행사 생성 (super 전용) |
| `app/admin/events/[id]/page.tsx` | 행사 상세, `?tab=` 쿼리로 분기: `info`/`fields`/`channels`/`nametag`/`meta`/`email`(super) · `stats`/`registrations`(전체) |
| `app/admin/events/[id]/registrations/page.tsx` | 참가자 전용 페이지 |
| `app/admin/events/[id]/print-nametags/page.tsx` | 네임택 인쇄 |
| `app/admin/checkin/[eventId]/page.tsx` | QR/카메라 출석체크 콘솔 |
| `app/admin/qr/page.tsx` | QR 코드 관리 |
| `app/admin/staff/page.tsx` | 담당자 계정 관리 (super 전용) |
| `app/admin/stats/page.tsx` | 전체 통계 대시보드 (5분 revalidate) |
| `app/admin/console/page.tsx` | 행사 콘솔 선택 목록 |
| `app/admin/console/[eventId]/page.tsx` | 콘솔 메인 (설정/현황 탭) |
| `app/admin/console/[eventId]/live/page.tsx` | 운영자용 라이브 컨트롤러 |

### API 라우트 요약
- `[slug]/register` — 참가자 등록 (정원/기간 검증, 확인메일 비동기 발송)
- `admin/console/{tracks,sessions}[/:id]` — 트랙·세션 CRUD
- `admin/event-staff`, `admin/staff[/:id]` — 담당자 배정/계정 관리
- `admin/qr[/:id]` — QR 생성/수정/삭제 (8자리 hex 코드, 중복 회피)
- `cron/send-emails` — 매분 실행 예약발송 워커 (`CRON_SECRET` 인증)
- `events[/:id]` — 행사 CRUD
- `events/[id]/channels[/:id]` — 웨비나 채널 CRUD
- `events/[id]/checkin-stats` — 체크인 통계
- `events/[id]/fields[/:id]` — 커스텀 필드 CRUD
- `events/[id]/nametag-template` — 네임택 템플릿 저장
- `events/[id]/registrations/export` — 엑셀 내보내기
- `events/[id]/registrations/search` — 발송 대상 검색
- `events/[id]/sends[/:id/logs]` — 이메일 발송 실행/이력
- `events/[id]/templates[/:id][/preview]` — 이메일 템플릿 CRUD·미리보기
- `events/[id]/track-view` — 방문 트래킹
- `events/[id]/walk-in-register` — 현장 즉석등록
- `live-sessions[/:id]` — 웨비나 시청세션 입장/하트비트/퇴장
- `registrations/[id][/checkin]` — 등록 수정/삭제, 체크인/체크인취소
- `render-email` — 템플릿 편집기용 실시간 HTML 렌더링

---

## 2. 주요 기능

### 인증 / 권한
- `lib/auth.ts`의 `getAdminUser()` — 세션 유저를 `admin_users`에서 조회해 role 판별
- 역할 2종: **super**(전체 CRUD) / **staff**(배정된 행사의 통계·참가자만 조회)
- `app/admin/layout.tsx` — 미인증시 사이드바 없이 렌더(로그인 페이지), 인증시 `AdminShell`로 감쌈

### 관리자 (super)
- 행사 CRUD, 유형별(오프라인/온라인/하이브리드) 설정, 검색
- 커스텀 필드 관리 (`FieldsManager`), 웨비나 채널 관리 (`ChannelsManager`)
- 네임택 디자인 (드래그 배치, 필드/QR 요소, `DEFAULT_NAMETAG_TEMPLATE`)
- SEO/메타 태그 설정 (`MetaTab`)
- 이메일 설정 및 발송 (4절 참고)

### 참가자 관리
- 목록(검색/필터/체크인/삭제/엑셀 내보내기), QR·카메라 기반 출석체크
- 현장 즉석등록 (이메일 미입력시 `walkin-{timestamp}@onsite.local` 자동 생성)

### 통계
- 전역(`/admin/stats`, 5분 캐시): 기간 필터(오늘/7일/30일/전체), 디바이스·브라우저·OS·국가·유입경로 분포, 시간별/일별/월별 추이, 행사별 방문·등록·전환율 테이블
- 행사별(`StatsTab`): 시청 통계 — 현재 접속자, 총 세션, 평균 시청 시간, 채널별 통계

### QR 코드
- 이름/대상 URL/설명으로 등록 → 8자리 hex 코드 자동 생성(중복 회피 재시도) → `/qr/[code]`에서 스캔카운트 증가 후 리다이렉트

### 사이드바(`AdminShell`/`AdminSidebar`)
- collapse 상태 `localStorage` 저장, 데스크탑 고정/모바일 오버레이, role 배지 표시

### 참가자 등록 (공개 페이지)
- 행사별 고유 URL(`/slug`)로 접속 후 등록, 기본 필드(이름/이메일/연락처/회사명/부서/직급) + 커스텀 필드 동적 렌더링
- 하이브리드 행사는 참석 방식(현장/온라인) 선택
- 등록 기간 검증(시작 전/마감 후 차단), 정원 검증(현장/온라인 각각, 또는 단일 유형은 `target_count`)
- 등록 완료 이메일 자동 발송 (행사별 ON/OFF 설정)

### 웨비나 (온라인 / 하이브리드)
- YouTube/Vimeo URL 자동 감지 임베드, 멀티 채널(채널 탭 전환)
- Supabase Realtime 기반 채널별 실시간 채팅
- 입장/하트비트(30초)/퇴장 자동 기록, 동시 접속 200명(Supabase 무료 플랜 기준)

---

## 3. 데이터 모델 (Supabase)

확인된 테이블: `admin_users`, `events`, `event_fields`, `event_staff`, `event_channels`, `event_views`, `registrations`, `tracks`, `sessions`, `message_templates`, `message_sends`, `message_send_logs`, `qr_codes`, `webinar_chats`, `webinar_sessions`.

### events (행사)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| slug | TEXT | URL 식별자 (유니크) |
| name | TEXT | 행사명 |
| type | TEXT | offline / online / hybrid |
| location | TEXT | 장소 (오프라인/하이브리드) |
| video_url | TEXT | 기본 영상 URL (온라인/하이브리드) |
| event_date | TIMESTAMPTZ | 행사 일시 |
| organizer | TEXT | 주관사 담당자 |
| target_count | INTEGER | 단일 유형 정원 |
| offline_capacity | INTEGER | 현장 정원 |
| online_capacity | INTEGER | 온라인 정원 |
| register_start | TIMESTAMPTZ | 등록 시작일시 |
| register_end | TIMESTAMPTZ | 등록 마감일시 |
| meta_title / meta_description | TEXT | 브라우저 탭 제목 / 검색 결과 설명 |
| favicon_url | TEXT | 파비콘 URL |
| og_title / og_description / og_image_url | TEXT | SNS 공유 메타 |
| theme_color | TEXT | 모바일 브라우저 테마 컬러 |
| is_indexable | BOOLEAN | 검색 엔진 노출 여부 |
| confirmation_email_enabled | BOOLEAN | 등록 완료 이메일 발송 여부 |
| confirmation_email_subject | TEXT | 이메일 제목 (null이면 기본값) |
| nametag_template | JSONB | 네임택 레이아웃 |
| created_at | TIMESTAMPTZ | 생성일 |

### event_fields (커스텀 필드)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id | UUID | FK → events |
| label | TEXT | 필드명 |
| field_type | TEXT | text / textarea / select / radio / checkbox |
| is_required | BOOLEAN | 필수 여부 |
| options | JSONB | 선택지 목록 |
| sort_order | INTEGER | 표시 순서 |

### event_channels (웨비나 채널)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id | UUID | FK → events |
| name | TEXT | 채널명 (예: Track A) |
| description | TEXT | 채널 설명 |
| video_url | TEXT | 채널별 영상 URL |
| sort_order | INTEGER | 표시 순서 |

### registrations (참가자 등록)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id | UUID | FK → events |
| name / email / phone / company / department / position | TEXT | 기본 정보 |
| attendance_type | TEXT | offline / online |
| custom_answers | JSONB | 커스텀 필드 답변 (라벨을 키로 저장) |
| registered_at | TIMESTAMPTZ | 등록일시 |
| checked_in_at | TIMESTAMPTZ | 체크인 시각 |

### tracks / sessions (행사 콘솔 — 4-1절 참고)

- **tracks**: `id, event_id, name, sort_order, is_common(공통세션 트랙 여부), created_at`
- **sessions**: `id, track_id, title, speaker, company, category, planned_start_at, planned_end_at, total_slides, current_slide, status(scheduled/ready/live/paused/ended/cancelled), rehearsal_notes, started_at, completed_at, issue_note` + 콘텐츠 필드(`has_video, video_pages, video_has_audio, is_distributable, content_note`) + 현장 준비 체크리스트(`speaker_consent_status, rehearsal_status, chair_count, pin_mic_count, hand_mic_count, av_check_status, setup_note, special_requests, operator_note`)

### message_templates / message_sends / message_send_logs (이메일 — 4-2절 참고)

- **message_templates**: `id, event_id, name, type(registration/reminder/custom), is_default, subject, body_html`
- **message_sends**: `id, event_id, template_id, subject, body_html, status(pending/scheduled/sending/completed/failed), filter_config, scheduled_at, total_count, success_count, fail_count`
- **message_send_logs**: `id, send_id, registration_id, email, status(pending/sent/failed), error_message, sent_at`

### qr_codes

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| code | TEXT | 8자리 hex, 유니크 |
| name / target_url / description | TEXT | 표시명 / 대상 URL / 설명 |
| is_active | BOOLEAN | 비활성시 410 |
| scan_count | INTEGER | 스캔 횟수 |

### webinar_chats (실시간 채팅)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id / channel_id | UUID | FK |
| user_name / message | TEXT | 채팅 참여자 / 메시지 |
| created_at | TIMESTAMPTZ | 전송 시각 |

### webinar_sessions (시청 세션)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id / channel_id | UUID | FK |
| user_name | TEXT | 시청자 이름 |
| joined_at / left_at / last_seen | TIMESTAMPTZ | 입장/퇴장/마지막 하트비트 |
| duration_seconds | INTEGER | 총 시청 시간(초) |

### event_views (방문 통계)
- `event_id, visited_at, device_type, browser, os, country, referrer`

### admin_users / event_staff

| 테이블 | 컬럼 | 설명 |
|---|---|---|
| admin_users | id(auth.users 참조), email, name, role(super/staff), created_at | 관리자 계정 |
| event_staff | id, event_id, user_id, created_at | 행사-담당자 배정 |

> `events`/`registrations`/`event_fields`/`message_*`/`qr_codes`/`event_views` 등의 원본 `CREATE TABLE` 마이그레이션 파일은 저장소에 없음 (Supabase 대시보드에서 직접 생성된 것으로 추정). `supabase/migration_console_v2.sql`만 저장소에 존재.

### Supabase 클라이언트 4종 (`lib/`)
- `supabase.ts` — anon key, RLS 적용 (공개 페이지)
- `supabase-admin.ts` — service role key, RLS 우회 (관리자 API)
- `supabase-server.ts` — 쿠키 기반 서버 컴포넌트용 (`getAdminUser`)
- `supabase-browser.ts` — 클라이언트 컴포넌트용 (로그인, Realtime 구독)

---

## 4. 하위 시스템 상세

### 4-1. 행사 콘솔(세션 진행 관리) 시스템

SessionFlow 참고 프로젝트를 이식해 구축 (참고 프로젝트는 이식 완료 후 삭제됨).

**구조**
- `/admin/console/[eventId]?tab=setup` — 트랙 추가/삭제(공통세션 여부 체크), 트랙별 세션 CRUD 모달
- `/admin/console/[eventId]?tab=overview` — `KpiBar` + `MorningTimeline`(공통트랙) + `TrackGrid`(일반트랙)
- `/admin/console/[eventId]/live` — 운영자 라이브 컨트롤러: 좌측 `SessionQueue`+`AddSessionForm`, 중앙 `CurrentSessionPanel`+`ControlButtons`, 우측 `TimerPanel`+`ContentForm`+`PrepChecklist`. 스페이스바로 진행중 세션 슬라이드 +1

**세션 상태 모델** (`lib/session-logic.ts`)
- 저장 상태 6종: `scheduled`/`ready`/`live`/`paused`/`ended`/`cancelled` (운영자가 명시적으로 설정)
- 파생 상태(`effective_status`, 매 틱 재계산, 30초 tolerance): 저장 상태 + 현재시각 비교로 `overtime`/`ended_early`/`issue` 등을 도출 — **저장값을 매번 덮어쓰지 않기 위한 핵심 설계**
- `computeKpis` — 전체 진행률(`(종료건수 + 진행중*0.5)/전체*100`), 진행중/초과/이슈/조기종료 건수, 다음 전환까지 남은 시간
- `STATUS_META` — 상태별 라벨/뱃지색 매핑 (단일 진실 소스)

**실시간 동기화** (`useConsoleSync.ts`)
- 1초 간격 로컬 타이머 갱신 + Supabase Realtime(`postgres_changes`)으로 `sessions` INSERT/UPDATE/DELETE 구독, 트랙 이동 반영
- 연결 상태(`connecting`/`connected`/`disconnected`) 배지 표시

**타임존 안전장치**
- `datetime-local` 입력을 브라우저 로컬시간 기준으로 해석해 ISO 변환하는 `toIsoOrNull` 헬퍼 (`ConsoleClient.tsx`) — 9시간 밀림 버그 방지

### 4-2. 이메일 시스템

**React Email 템플릿** (`emails/`)
- `BaseLayout.tsx` — 공통 헤더/푸터
- `InfoCard.tsx` — 아이콘+라벨+값 카드
- `RegistrationEmail.tsx` — 등록완료 메일(일시/장소/참석방식, QR 이미지, 온라인 라이브입장 버튼)
- `ReminderEmail.tsx` — 리마인드 메일(커스텀 메시지 지원)
- `CustomEmail.tsx` — 자유 HTML 본문 + CTA 버튼

**`lib/email.ts`**
- Resend 클라이언트, 발송 함수(`sendConfirmationEmail`/`sendReminderEmail`/`sendCustomEmail`), 렌더 전용 함수(`renderRegistrationEmail`/`renderReminderEmail`/`renderCustomEmail`)

**관리 UI** (`EmailTab` → 3개 서브탭)
- **TemplatesTab**: 목록(타입뱃지, 기본템플릿 표시), 편집 모드 2종 — "기본 설정"(제목/본문 텍스트, `{{name}}` 치환) / "HTML+미리보기"(소스 편집 + iframe 실시간 미리보기). 기본설정 변경시 800ms debounce로 HTML 자동 동기화(`htmlDirty` 플래그로 수동편집 시 동기화 중단)
- **SendTab**: 3단계 위저드 — 템플릿 선택 → 수신자 필터(참석방식/체크인여부) → 발송 확인(즉시 또는 예약)
- **HistoryTab**: 발송 이력(상태뱃지: 대기/예약됨/발송중/완료/실패), 상세 모달에서 수신자별 로그·성공률

**Cron 예약 발송**
- `vercel.json`: `* * * * *`(매분), 리전 `icn1`
- `/api/cron/send-emails`: `CRON_SECRET` 인증 → `scheduled` 상태이며 시각 도래한 발송 최대 10건 → `sending`으로 락 → 로그 순회 발송(100ms 간격, `{{name}}` 치환) → 완료/실패 카운트 반영

---

## 5. 인프라 / 운영

### 타임존
- `instrumentation.ts` — Vercel(Lambda) 런타임이 `TZ` 환경변수를 예약어로 막아 대시보드 설정이 불가능하므로, `register()` 훅에서 `process.env.TZ='Asia/Seoul'`을 코드로 강제 지정. 타임존 미지정 `Date`/`Intl` 호출과 "오늘 자정" 등 날짜 경계 계산이 KST 기준이 되도록 함

### ISR 캐싱/성능
- `app/[slug]/page.tsx`: `revalidate=60` + `unstable_cache`로 메타데이터/페이지 DB조회 공유
- `app/[slug]/live/page.tsx`: `revalidate=30`
- `app/admin/stats/page.tsx`: `revalidate=300`
- `next.config.ts`: `qrcode`/`xlsx` 패키지 트리쉐이킹, 외부 도메인 이미지(OG 이미지 등) 전체 허용

### 배포 설정
- `vercel.json`: 리전 `icn1`(서울) 고정, 매분 Cron(`send-emails`)

### SEO/파비콘
- `app/layout.tsx` — 루트 메타데이터, Geist 폰트, 앱 파비콘
- `app/[slug]/page.tsx`/`live/page.tsx`의 `generateMetadata` — 행사별 동적 메타(제목/설명/파비콘/OG/테마컬러/`robots`)를 `events` 테이블 SEO 컬럼에서 반영, `MetaTab`(admin)에서 편집

---

## 6. 환경 변수

`.env.local` 파일을 생성하고 아래 값을 설정합니다.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (이메일 발송)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# 서비스 도메인
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Cron 인증 (이메일 예약 발송)
CRON_SECRET=your_cron_secret
```

---

## 7. 첫 슈퍼 관리자 설정

1. Supabase 대시보드 → Authentication → Users → **Add user**
2. 생성된 유저 ID로 SQL 실행:

```sql
INSERT INTO admin_users (id, email, name, role)
VALUES ('생성된-uuid', 'admin@example.com', '관리자', 'super');
```

---

## 8. 로컬 실행

```bash
npm install
npm run dev
```

---

## 9. 기능 추가 예정 (TODO)

### 참가자 등록
- [ ] 중복 등록 방지 (이메일 기준)
- [ ] 등록 취소 기능

### 관리자
- [ ] 행사 복제 기능
- [ ] 커스텀 필드 순서 드래그 변경
- [ ] 등록 폼 미리보기

### 웨비나
- [ ] 시청 통계 실시간 자동 갱신
- [ ] 동시 접속자 200명 초과 시 Ably 전환
- [ ] 채널별 입장 제한 (비밀번호 등)

### 기타
- [ ] 행사 목록 페이지네이션
- [ ] 다국어 지원 (한국어 / 영어)

---

## 알려진 이슈 / 미비점

- 위 DB 구조 문서는 코드(`lib/types.ts`, `supabase/migration_console_v2.sql`) 기준으로 재구성한 것으로, 원본 `CREATE TABLE` 마이그레이션 파일이 저장소에 없는 테이블들이 있음 (3절 하단 참고)
</content>
