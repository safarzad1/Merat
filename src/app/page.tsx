"use client";

import { useState, type ReactNode } from "react";

type IconName =
  | "home" | "users" | "map" | "building" | "flow" | "chart"
  | "settings" | "bell" | "menu" | "close" | "arrow" | "plus"
  | "search" | "calendar" | "check" | "clock";

function Icon({ name, size = 21 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    building: <><path d="M4 21V4h12v17M16 9h4v12M8 8h4M8 12h4M8 16h4M2 21h20" /></>,
    flow: <><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M9 6h4a5 5 0 0 1 5 5v4M15 18h-4a5 5 0 0 1-5-5V9" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.37.38.7.69.96.3.26.7.4 1.1.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const menuItems: { title: string; icon: IconName; active?: boolean; badge?: string }[] = [
  { title: "پیشخوان", icon: "home", active: true },
  { title: "مدیریت کاربران", icon: "users" },
  { title: "ساختار محل‌ها", icon: "map" },
  { title: "حوزه‌های انتخابیه", icon: "building" },
  { title: "گردش کار", icon: "flow", badge: "۸" },
  { title: "گزارش‌ها", icon: "chart" },
  { title: "تنظیمات سامانه", icon: "settings" },
];

const stats: { title: string; value: string; detail: string; icon: IconName; tone: string }[] = [
  { title: "حوزه‌های انتخابیه", value: "۲۰۸", detail: "در سراسر کشور", icon: "building", tone: "teal" },
  { title: "شهرستان‌های فعال", value: "۴۸۲", detail: "در ۳۱ استان", icon: "map", tone: "blue" },
  { title: "کاربران فعال", value: "۱٬۲۸۶", detail: "در چهار سطح دسترسی", icon: "users", tone: "amber" },
  { title: "درخواست‌های جاری", value: "۳۴", detail: "۸ مورد نیازمند بررسی", icon: "flow", tone: "violet" },
];

const activities = [
  { title: "ثبت کاربر جدید", area: "استان آذربایجان شرقی", date: "۱۴۰۵/۰۶/۰۵", status: "تکمیل شده", statusType: "done" },
  { title: "اصلاح اطلاعات حوزه", area: "تبریز، آذرشهر و اسکو", date: "۱۴۰۵/۰۶/۰۵", status: "در حال بررسی", statusType: "pending" },
  { title: "تغییر سمت کاربر", area: "حوزه انتخابیه بستان‌آباد", date: "۱۴۰۵/۰۶/۰۴", status: "تکمیل شده", statusType: "done" },
  { title: "افزودن نماینده شهرستان", area: "شهرستان آذرشهر", date: "۱۴۰۵/۰۶/۰۳", status: "منتظر تأیید", statusType: "waiting" },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-overlay" aria-label="بستن منو" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span>م</span></div>
          <div><p className="title-font brand-title">سامانه جامع مرآت</p><p className="brand-subtitle">مدیریت یکپارچه انتخابات</p></div>
          <button className="icon-button sidebar-close" aria-label="بستن منو" onClick={() => setSidebarOpen(false)}><Icon name="close" /></button>
        </div>

        <div className="sidebar-user">
          <div className="avatar">ق‌س</div>
          <div className="sidebar-user-text"><p className="title-font">قاسم صفرزاد</p><span>کارشناس ستاد</span></div>
          <Icon name="arrow" size={17} />
        </div>

        <nav className="sidebar-nav" aria-label="منوی اصلی">
          <p className="nav-label">منوی اصلی</p>
          {menuItems.map((item) => (
            <button key={item.title} className={`nav-item ${item.active ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
              <span className="nav-icon"><Icon name={item.icon} /></span><span>{item.title}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {!item.badge && !item.active && <Icon name="arrow" size={15} />}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot"><span className="online-dot" /><span>ارتباط با سرور برقرار است</span><span className="version">نسخه ۱.۰</span></div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div className="topbar-right">
            <button className="icon-button menu-button" aria-label="باز کردن منو" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
            <div><h1 className="title-font page-title">پیشخوان مدیریت</h1><p className="breadcrumb">خانه <span>/</span> پیشخوان</p></div>
          </div>
          <div className="topbar-left">
            <button className="icon-button notification-button" aria-label="اعلان‌ها"><Icon name="bell" /><span className="notification-dot" /></button>
            <span className="topbar-divider" />
            <div className="date-box"><Icon name="calendar" size={18} /><span>چهارشنبه، ۵ شهریور ۱۴۰۵</span></div>
          </div>
        </header>

        <main className="dashboard">
          <section className="welcome-card">
            <div className="welcome-copy"><p className="eyebrow">نمای کلی سامانه</p><h2 className="title-font">سلام، به سامانه مرآت خوش آمدید</h2><p>اطلاعات ساختار سازمانی، حوزه‌های انتخابیه و کاربران را از این بخش مدیریت کنید.</p></div>
            <div className="access-card"><span className="access-label">سطح دسترسی جاری</span><div className="access-value"><span className="access-icon"><Icon name="building" size={20} /></span><div><p className="title-font">ستاد مرکزی</p><span>دسترسی به تمام استان‌ها</span></div></div></div>
            <div className="welcome-pattern" aria-hidden="true" />
          </section>

          <section className="stats-grid" aria-label="آمار کلی">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.title}>
                <div className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={24} /></div>
                <div className="stat-content"><p>{stat.title}</p><div><span className="title-font stat-value">{stat.value}</span><span className="stat-detail">{stat.detail}</span></div></div>
                <button className="stat-link" aria-label={`مشاهده ${stat.title}`}><Icon name="arrow" size={17} /></button>
              </article>
            ))}
          </section>

          <section className="hierarchy-card section-card">
            <div className="section-heading">
              <div><p className="eyebrow">ساختار دسترسی</p><h3 className="title-font">مسیر سلسله‌مراتبی سامانه</h3></div>
              <button className="soft-button"><Icon name="map" size={18} />مشاهده ساختار کامل</button>
            </div>
            <div className="hierarchy-flow">
              <div className="level-item current"><span className="level-number">۱</span><div><p className="title-font">ستاد</p><span>ایران</span></div></div><span className="flow-line" />
              <div className="level-item"><span className="level-number">۲</span><div><p className="title-font">استان</p><span>آذربایجان شرقی</span></div></div><span className="flow-line" />
              <div className="level-item"><span className="level-number">۳</span><div><p className="title-font">حوزه انتخابیه</p><span>تبریز، آذرشهر و اسکو</span></div></div><span className="flow-line" />
              <div className="level-item"><span className="level-number">۴</span><div><p className="title-font">شهرستان</p><span>آذرشهر</span></div></div>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="section-card activity-card">
              <div className="section-heading"><div><p className="eyebrow">آخرین تغییرات</p><h3 className="title-font">فعالیت‌های اخیر</h3></div><button className="text-button">مشاهده همه <Icon name="arrow" size={15} /></button></div>
              <div className="table-wrap"><table><thead><tr><th>عنوان فعالیت</th><th>محل</th><th>تاریخ</th><th>وضعیت</th></tr></thead><tbody>{activities.map((item) => <tr key={`${item.title}-${item.area}`}><td>{item.title}</td><td>{item.area}</td><td>{item.date}</td><td><span className={`status ${item.statusType}`}>{item.statusType === "done" ? <Icon name="check" size={14} /> : <Icon name="clock" size={14} />}{item.status}</span></td></tr>)}</tbody></table></div>
            </section>

            <section className="section-card quick-card">
              <div className="section-heading"><div><p className="eyebrow">دسترسی سریع</p><h3 className="title-font">عملیات پرکاربرد</h3></div></div>
              <div className="quick-list">
                <button><span className="quick-icon teal"><Icon name="plus" /></span><span><span className="title-font">افزودن کاربر جدید</span><small>ثبت کاربر و تعیین سمت</small></span><Icon name="arrow" size={16} /></button>
                <button><span className="quick-icon blue"><Icon name="search" /></span><span><span className="title-font">جستجوی محل</span><small>استان، حوزه یا شهرستان</small></span><Icon name="arrow" size={16} /></button>
                <button><span className="quick-icon amber"><Icon name="chart" /></span><span><span className="title-font">گزارش مدیریتی</span><small>مشاهده آمار به‌روز</small></span><Icon name="arrow" size={16} /></button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
