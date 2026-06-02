export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-700">
        <span className="text-xl font-bold tracking-tight">MyApp</span>
        <div className="flex gap-4 items-center">
          <a href="#features" className="text-slate-300 hover:text-white text-sm transition-colors">기능</a>
          <a href="#pricing" className="text-slate-300 hover:text-white text-sm transition-colors">요금제</a>
          <a href="/admin" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            관리자
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-6">
        <span className="text-sm font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
          베타 출시
        </span>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight max-w-3xl">
          더 스마트하게,<br />더 빠르게
        </h1>
        <p className="text-slate-400 text-lg max-w-xl">
          MyApp은 팀의 생산성을 극대화하는 올인원 플랫폼입니다. 지금 바로 시작해보세요.
        </p>
        <div className="flex gap-3 mt-2">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            무료로 시작하기
          </button>
          <button className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors">
            데모 보기
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "⚡", title: "빠른 성능", desc: "최적화된 인프라로 지연 없는 경험을 제공합니다." },
            { icon: "🔒", title: "강력한 보안", desc: "엔터프라이즈급 보안으로 데이터를 안전하게 보호합니다." },
            { icon: "📊", title: "실시간 분석", desc: "대시보드에서 모든 지표를 한눈에 확인하세요." },
          ].map((f) => (
            <div key={f.title} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-8 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">요금제</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "무료", price: "₩0", period: "/월", features: ["최대 3명", "5GB 스토리지", "기본 분석"], highlight: false },
            { name: "프로", price: "₩29,000", period: "/월", features: ["무제한 멤버", "100GB 스토리지", "고급 분석", "우선 지원"], highlight: true },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 border ${
                plan.highlight
                  ? "bg-indigo-600 border-indigo-500"
                  : "bg-slate-800/50 border-slate-700"
              }`}
            >
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm opacity-70">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-slate-100"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                시작하기
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 px-8 py-8 text-center text-slate-500 text-sm">
        © 2026 MyApp. All rights reserved.
      </footer>
    </main>
  );
}
