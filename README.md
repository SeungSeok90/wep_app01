# 행사 등록 플랫폼

행사를 생성하고, 참가자가 URL로 접속해 등록할 수 있는 플랫폼입니다.

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL) |
| 엑셀 내보내기 | xlsx |
| 배포 | Vercel |

---

## 서비스 구조

```
/                        → 메인 페이지
/admin                   → 관리자 - 행사 목록
/admin/events/new        → 관리자 - 새 행사 만들기
/admin/events/[id]       → 관리자 - 행사 상세 (기본 정보 / 추가 필드 / 참가자 목록)
/[slug]                  → 참가자 등록 폼 페이지
```

---

## 주요 기능

### 관리자

- **행사 CRUD** — 행사 생성, 조회, 수정, 삭제
- **행사 검색** — 행사명, 장소, 담당자 통합 검색
- **커스텀 필드** — 행사별 추가 등록 항목 설정 (단답형, 장문, 드롭다운, 단일선택, 다중선택)
- **참가자 목록** — 행사별 등록자 확인 (커스텀 필드 포함)
- **엑셀 내보내기** — 참가자 목록 .xlsx 다운로드

### 참가자

- **등록 폼** — 행사별 고유 URL(`/행사슬러그`)로 접속 후 등록
- **기본 필드** — 이름, 이메일, 연락처, 회사명, 부서, 직급
- **커스텀 필드** — 관리자가 설정한 추가 항목 동적 렌더링
- **등록 기간 검증** — 시작 전 / 마감 후 접근 차단
- **정원 초과 검증** — 타겟 인원 초과 시 등록 차단

---

## DB 구조

### events (행사)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| slug | TEXT | URL 식별자 (유니크) |
| name | TEXT | 행사명 |
| location | TEXT | 장소 |
| event_date | TIMESTAMPTZ | 행사 일시 |
| organizer | TEXT | 주관사 담당자 |
| target_count | INTEGER | 등록 타겟 인원 |
| register_start | TIMESTAMPTZ | 등록 시작일시 |
| register_end | TIMESTAMPTZ | 등록 마감일시 |
| created_at | TIMESTAMPTZ | 생성일 |

### event_fields (커스텀 필드)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| event_id | UUID | FK → events |
| label | TEXT | 필드명 |
| field_type | TEXT | text / textarea / select / radio / checkbox |
| is_required | BOOLEAN | 필수 여부 |
| options | JSONB | 선택지 목록 (드롭다운 등) |
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
| custom_answers | JSONB | 커스텀 필드 답변 |
| registered_at | TIMESTAMPTZ | 등록일시 |

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
- [ ] 대시보드 통계 (행사별 등록 현황, 달성률)
- [ ] 커스텀 필드 순서 드래그 변경

### 등록 폼
- [ ] 등록 폼 미리보기 (관리자에서 확인)
- [ ] 파일 업로드 필드 타입 추가
- [ ] 다국어 지원 (한국어 / 영어)

### 기타
- [ ] 행사 목록 페이지네이션
- [ ] 참가자 목록 검색 / 필터
- [ ] 모바일 반응형 개선
