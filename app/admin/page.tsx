const stats = [
  { label: "총 유저", value: "1,284", change: "+12%", up: true },
  { label: "이번 달 가입", value: "148", change: "+8%", up: true },
  { label: "월간 매출", value: "₩4,320,000", change: "+23%", up: true },
  { label: "이탈률", value: "3.2%", change: "-1.1%", up: false },
];

const users = [
  { id: 1, name: "김민준", email: "minjun@example.com", plan: "프로", status: "활성", joined: "2026-05-12" },
  { id: 2, name: "이서연", email: "seoyeon@example.com", plan: "무료", status: "활성", joined: "2026-05-20" },
  { id: 3, name: "박도현", email: "dohyun@example.com", plan: "프로", status: "정지", joined: "2026-04-03" },
  { id: 4, name: "최지우", email: "jiwoo@example.com", plan: "무료", status: "활성", joined: "2026-06-01" },
  { id: 5, name: "정하은", email: "haeun@example.com", plan: "프로", status: "활성", joined: "2026-03-15" },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Sidebar + Content layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
          <div className="px-6 py-5 border-b border-slate-700">
            <span className="font-bold text-lg">나의 처음 사이트</span>
            <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            {[
              { label: "대시보드", active: true },
              { label: "유저 관리", active: false },
              { label: "결제 관리", active: false },
              { label: "공지사항", active: false },
              { label: "설정", active: false },
            ].map((item) => (
              <button
                key={item.label}
                className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  item.active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
              ← 홈으로
            </a>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">대시보드</h1>
              <p className="text-slate-500 text-sm mt-1">2026년 6월 2일 기준</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              리포트 내보내기
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                <p className="text-2xl font-bold mb-1">{s.value}</p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.up
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  {s.change}
                </span>
              </div>
            ))}
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold">최근 유저</h2>
              <button className="text-sm text-indigo-600 hover:text-indigo-500">전체 보기</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-100">
                  <th className="px-6 py-3 text-left font-medium">이름</th>
                  <th className="px-6 py-3 text-left font-medium">이메일</th>
                  <th className="px-6 py-3 text-left font-medium">플랜</th>
                  <th className="px-6 py-3 text-left font-medium">상태</th>
                  <th className="px-6 py-3 text-left font-medium">가입일</th>
                  <th className="px-6 py-3 text-left font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.plan === "프로"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "활성"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{user.joined}</td>
                    <td className="px-6 py-4">
                      <button className="text-slate-400 hover:text-slate-700 text-xs transition-colors">
                        편집
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
