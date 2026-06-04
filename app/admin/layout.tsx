import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar />
      {/* 모바일: 상단바 높이(56px) 패딩 / 데스크탑: 사이드바 너비(224px) 패딩 */}
      <div className="pt-14 lg:pt-0 lg:pl-56">
        {children}
      </div>
    </div>
  )
}
