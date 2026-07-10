-- SessionFlow 기능 이식을 위한 콘솔 스키마 확장
-- Supabase SQL Editor에서 실행하세요. 기존 데이터를 삭제하지 않는 추가/갱신 마이그레이션입니다.

-- tracks: 오전 공통 세션 트랙 여부
alter table tracks add column if not exists is_common boolean not null default false;

-- sessions: 기존 제약조건을 먼저 제거 (새 값 update와 기존 값이 동시에 존재하는 과도기를 허용하기 위함)
alter table sessions drop constraint if exists sessions_status_check;

-- sessions: 기존 'completed' 상태값을 'ended'로 통일
update sessions set status = 'ended' where status = 'completed';

-- sessions: 데이터 정리가 끝난 뒤 새 상태값(6종) 기준으로 제약조건 재생성
alter table sessions add constraint sessions_status_check
  check (status in ('scheduled','ready','live','paused','ended','cancelled'));

-- sessions: 콘텐츠 / 이슈 / 현장 준비 체크리스트 필드 추가
alter table sessions
  add column if not exists issue_note text,
  add column if not exists company text not null default '',
  add column if not exists category text not null default '',
  add column if not exists has_video boolean not null default false,
  add column if not exists video_pages text not null default '',
  add column if not exists video_has_audio boolean not null default false,
  add column if not exists is_distributable boolean not null default true,
  add column if not exists content_note text not null default '',
  add column if not exists speaker_consent_status text not null default 'not_received',
  add column if not exists rehearsal_status text not null default 'not_done',
  add column if not exists chair_count integer not null default 0,
  add column if not exists pin_mic_count integer not null default 0,
  add column if not exists hand_mic_count integer not null default 0,
  add column if not exists av_check_status text not null default 'not_checked',
  add column if not exists setup_note text not null default '',
  add column if not exists special_requests text not null default '',
  add column if not exists operator_note text not null default '';
