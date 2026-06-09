# 행사 등록 플랫폼

행사를 생성하고, 참가자가 URL로 접속해 등록할 수 있는 플랫폼입니다.
오프라인 / 온라인(웨비나) / 하이브리드 행사를 모두 지원합니다.

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL + Realtime) |
| 엑셀 내보내기 | xlsx |
| 배포 | Vercel |

---

## 서비스 구조

```
/                                  → 메인 페이지
/admin                             → 관리자 - 행사 목록 (검색 포함)
/admin/events/new                  → 관리자 - 새 행사 만들기
/admin/events/[id]                 → 관리자 - 행사 상세
  ?tab=info                        →   기본 정보 편집
  ?tab=fields                      →   추가 등록 필드 관리
  ?tab=channels                    →   채널(트랙) 관리
  ?tab=stats                       →   시청 통계
  ?tab=nametag                     →   네임택 디자인
  ?tab=meta                        →   SEO / 메타 태그 설정
  ?tab=registrations               →   참가자 목록
/[slug]                            → 참가자 등록 폼 페이지
/[slug]/live                       → 웨비나 라이브 페이지 (영상 + 채팅)
```

---

## 주요 기능

### 관리자

- **행사 CRUD** — 행사 생성, 조회, 수정, 삭제
- **행사 유형** — 오프라인 / 온라인(웨비나) / 하이브리드 선택
- **행사 검색** — 행사명, 장소, 담당자 통합 검색
- **커스텀 필드** — 행사별 추가 등록 항목 설정 (단답형, 장문, 드롭다운, 단일선택, 다중선택)
- **채널(트랙) 관리** — 멀티 트랙 행사를 위한 채널별 영상 URL 설정
- **참가자 목록** — 현장/온라인 인원 통계 카드, 참석 방식 구분, 엑셀 내보내기
- **시청 통계** — 현재 접속자, 총 세션, 평균 시청 시간, 채널별 통계, 세션 기록
- **네임택 디자인** — 출석 체크 완료 후 네임택 인쇄 레이아웃 설정
- **SEO / 메타 태그** — 페이지 제목·설명, 파비콘, OG 태그(카카오톡·슬랙 등 공유 미리보기), 테마 컬러, 검색 엔진 노출 설정

### 참가자

- **등록 폼** — 행사별 고유 URL(`/slug`)로 접속 후 등록
- **기본 필드** — 이름, 이메일, 연락처, 회사명, 부서, 직급
- **커스텀 필드** — 관리자가 설정한 추가 항목 동적 렌더링
- **참석 방식 선택** — 하이브리드 행사에서 현장/온라인 선택
- **등록 기간 검증** — 시작 전 / 마감 후 접근 차단
- **정원 검증** — 현장/온라인 각각 정원 초과 시 마감 처리

### 웨비나 (온라인 / 하이브리드)

- **영상 플레이어** — YouTube, Vimeo URL 자동 감지 후 임베드
- **멀티 채널** — 채널 탭 전환으로 여러 트랙 동시 운영
- **실시간 채팅** — Supabase Realtime 기반, 채널별 독립 채팅방
- **접속 시간 트래킹** — 입장/하트비트(30초)/퇴장 자동 기록
- **동시 접속 200명** — Supabase 무료 플랜 기준

---

## DB 구조

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
| offline_capacity | INTEGER | 현장 정원 |
| online_capacity | INTEGER | 온라인 정원 |
| register_start | TIMESTAMPTZ | 등록 시작일시 |
| register_end | TIMESTAMPTZ | 등록 마감일시 |
| meta_title | TEXT | 브라우저 탭 제목 |
| meta_description | TEXT | 검색 결과 설명 |
| favicon_url | TEXT | 파비콘 URL |
| og_title | TEXT | SNS 공유 제목 |
| og_description | TEXT | SNS 공유 설명 |
| og_image_url | TEXT | SNS 공유 이미지 URL |
| theme_color | TEXT | 모바일 브라우저 테마 컬러 |
| is_indexable | BOOLEAN | 검색 엔진 노출 여부 |
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
| name | TEXT | 이름 |
| email | TEXT | 이메일 |
| phone | TEXT | 연락처 |
| company | TEXT | 회사명 |
| department | TEXT | 부서 |
| position | TEXT | 직급 |
| attendance_type | TEXT | offline / online |
| custom_answers | JSONB | 커스텀 필드 답변 |
| registered_at | TIMESTAMPTZ | 등록일시 |

### webinar_chats (실시간 채팅)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id | UUID | FK → events |
| channel_id | UUID | FK → event_channels |
| user_name | TEXT | 채팅 참여자 이름 |
| message | TEXT | 메시지 내용 |
| created_at | TIMESTAMPTZ | 전송 시각 |

### webinar_sessions (시청 세션)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id | UUID | FK → events |
| channel_id | UUID | FK → event_channels |
| user_name | TEXT | 시청자 이름 |
| joined_at | TIMESTAMPTZ | 입장 시각 |
| left_at | TIMESTAMPTZ | 퇴장 시각 |
| last_seen | TIMESTAMPTZ | 마지막 하트비트 |
| duration_seconds | INTEGER | 총 시청 시간(초) |

---

## 환경 변수

`.env.local` 파일을 생성하고 아래 값을 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_DB_PASSWORD=your_db_password
```

---

## 로컬 실행

```bash
npm install
npm run dev
```

---

## 기능 추가 예정 (TODO)

### 인증 / 보안
- [ ] 관리자 로그인 (이메일 + 비밀번호)
- [ ] Supabase RLS 정책 강화 (인증된 사용자만 관리자 기능 접근)
- [ ] 행사별 관리자 권한 분리

### 참가자 등록
- [ ] 중복 등록 방지 (이메일 기준)
- [ ] 등록 완료 확인 이메일 자동 발송
- [ ] 등록 취소 기능

### 관리자
- [ ] 참가자 개별 삭제 / 수정
- [ ] 행사 복제 기능
- [ ] 커스텀 필드 순서 드래그 변경

### 등록 폼
- [ ] 등록 폼 미리보기 (관리자에서 확인)
- [ ] 파일 업로드 필드 타입 추가
- [ ] 다국어 지원 (한국어 / 영어)

### 웨비나
- [ ] 시청 통계 실시간 자동 갱신
- [ ] 동시 접속자 200명 초과 시 Ably 전환
- [ ] 채널별 입장 제한 (비밀번호 등)

### 기타
- [ ] 행사 목록 페이지네이션
- [ ] 참가자 목록 검색 / 필터
