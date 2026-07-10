// Vercel(AWS Lambda 기반) Node 런타임은 TZ 환경변수를 예약어로 막아두고 있어
// 대시보드에서 직접 설정할 수 없다. 서버 프로세스 시작 시점에 process.env.TZ를
// 코드로 지정해 우회한다 — timeZone을 명시하지 않은 모든 Date/Intl 호출
// (toLocaleString 등)과 "오늘 자정" 같은 날짜 경계 계산이 한국시간 기준이 된다.
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.env.TZ = 'Asia/Seoul'
  }
}
