"use client";

import { useEffect, useState, type ReactNode } from "react";
import BaseDefinitions from "../component/BaseDefinitions";
import { SearchableDropdown, type DropdownOption } from "../component/Dropdown";
import ElectionCandidates from "../component/ElectionCandidates";
import Persons from "../component/Persons";
import UsersTree from "../component/UsersTree";

type IconName =
  | "home" | "users" | "map" | "building" | "flow" | "chart"
  | "settings" | "bell" | "menu" | "close" | "arrow" | "plus"
  | "search" | "calendar" | "check" | "clock" | "briefcase"
  | "edit" | "trash" | "more" | "user" | "logout";

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
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    edit: <><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="m18.4 2.6 3 3L12 15l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 3h6l1 4H8Z" /><path d="m6 7 1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

type MenuItem = {
  title: string;
  icon: IconName;
  active?: boolean;
  badge?: string;
  children?: { title: string; badge?: string }[];
};

const menuGroups: { title: string; items: MenuItem[] }[] = [
  {
    title: "عمومی",
    items: [{ title: "پیشخوان", icon: "home", active: true }],
  },
  {
    title: "مدیریت پایه",
    items: [
      {
        title: "اطلاعات پایه",
        icon: "briefcase",
        children: [{ title: "تعاریف پایه" }, { title: "پست‌های سازمانی" }],
      },
      {
        title: "کاربران و دسترسی‌ها",
        icon: "users",
        children: [
          { title: "فهرست اشخاص" },
          { title: "فهرست کاربران" },
          { title: "سمت‌های سازمانی" },
          { title: "سطوح دسترسی" },
        ],
      },
      {
        title: "ساختار جغرافیایی",
        icon: "map",
        children: [
          { title: "استان‌ها" },
          { title: "حوزه‌های انتخابیه" },
          { title: "شهرستان‌ها" },
        ],
      },
    ],
  },
  {
    title: "عملیات سامانه",
    items: [
      {
        title: "داوطلبان انتخابات",
        icon: "users",
        children: [{ title: "اشخاص" }],
      },
      {
        title: "فرایندهای انتخاباتی",
        icon: "flow",
        badge: "۸",
        children: [
          { title: "کارتابل ورودی", badge: "۸" },
          { title: "درخواست‌های ثبت‌شده" },
          { title: "سوابق بررسی" },
        ],
      },
      {
        title: "اطلاعات انتخابات",
        icon: "building",
        children: [
          { title: "دوره‌های انتخابات" },
          { title: "تعریف حوزه‌ها" },
          { title: "سهمیه حوزه‌ها" },
        ],
      },
    ],
  },
  {
    title: "پایش و تنظیمات",
    items: [
      { title: "گزارش‌ها", icon: "chart", children: [{ title: "گزارش مدیریتی" }, { title: "گزارش عملکرد" }] },
      { title: "تنظیمات سامانه", icon: "settings", children: [{ title: "تنظیمات عمومی" }, { title: "ثبت فعالیت‌ها" }] },
    ],
  },
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

type OrganizationalPost = {
  postId: number;
  title: string;
  placeType: 1 | 2 | 3 | 4;
};

type ThemeName = "ocean" | "emerald";

const themeOptions: { name: ThemeName; label: string }[] = [
  { name: "ocean", label: "آبی اقیانوسی" },
  { name: "emerald", label: "سبز سامانه ارسال" },
];

const placeTypes = {
  1: { title: "ستاد", className: "headquarters" },
  2: { title: "استان", className: "province" },
  3: { title: "حوزه انتخابیه", className: "district" },
  4: { title: "شهرستان", className: "county" },
} as const;

const placeFilterOptions: DropdownOption<string>[] = [
  { value: "0", label: "همه سطوح محل", searchText: "همه" },
  { value: "1", label: "ستاد" },
  { value: "2", label: "استان" },
  { value: "3", label: "حوزه انتخابیه", searchText: "حوزه" },
  { value: "4", label: "شهرستان" },
];

const postPlaceOptions: DropdownOption<"1" | "2" | "3" | "4">[] = [
  { value: "1", label: "ستاد", description: "قابل تخصیص در سطح ستاد" },
  { value: "2", label: "استان", description: "قابل تخصیص در سطح استان" },
  { value: "3", label: "حوزه انتخابیه", description: "قابل تخصیص در سطح حوزه" },
  { value: "4", label: "شهرستان", description: "قابل تخصیص در سطح شهرستان" },
];

export default function Home() {
  const [currentUserName, setCurrentUserName] = useState("کاربر سامانه");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(["اطلاعات پایه"]);
  const [currentView, setCurrentView] = useState<"dashboard" | "posts" | "definitions" | "persons" | "users" | "candidates">("dashboard");
  const [posts, setPosts] = useState<OrganizationalPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsBusy, setPostsBusy] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [placeFilter, setPlaceFilter] = useState("0");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postPlaceType, setPostPlaceType] = useState<"1" | "2" | "3" | "4">("1");
  const [theme, setTheme] = useState<ThemeName>("ocean");

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unauthorized");
        return response.json() as Promise<{ user?: { fullName?: string } }>;
      })
      .then((result) => {
        if (active && result.user?.fullName) setCurrentUserName(result.user.fullName);
      })
      .catch(() => {
        if (active) window.location.assign("/login");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("merat-theme");
    if (savedTheme === "ocean" || savedTheme === "emerald") setTheme(savedTheme);
  }, []);

  const changeTheme = (nextTheme: ThemeName) => {
    setTheme(nextTheme);
    window.localStorage.setItem("merat-theme", nextTheme);
  };

  const loadPosts = async () => {
    setPostsLoading(true);
    setPostsError("");
    try {
      const response = await fetch("/api/posts", { cache: "no-store" });
      const result = await response.json() as { items?: { PostId: number; OnvanPost: string; TypeMahal: 1 | 2 | 3 | 4 }[]; message?: string };
      if (!response.ok) throw new Error(result.message || "دریافت سمت‌ها انجام نشد.");
      setPosts((result.items ?? []).map((item) => ({ postId: Number(item.PostId), title: item.OnvanPost, placeType: Number(item.TypeMahal) as OrganizationalPost["placeType"] })));
    } catch (error) {
      setPostsError(error instanceof Error ? error.message : "دریافت سمت‌ها انجام نشد.");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => { if (currentView === "posts") void loadPosts(); }, [currentView]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  };

  const toggleMenu = (title: string) => {
    setOpenMenus((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesText = post.title.includes(searchText.trim()) || String(post.postId).includes(searchText.trim());
    return matchesText && (placeFilter === "0" || String(post.placeType) === placeFilter);
  });

  const openCreatePost = () => {
    setEditingPostId(null);
    setPostTitle("");
    setPostPlaceType("1");
    setFormOpen(true);
  };

  const openEditPost = (post: OrganizationalPost) => {
    setEditingPostId(post.postId);
    setPostTitle(post.title);
    setPostPlaceType(String(post.placeType) as "1" | "2" | "3" | "4");
    setFormOpen(true);
  };

  const savePost = async () => {
    if (!postTitle.trim()) return;
    const placeType = Number(postPlaceType) as OrganizationalPost["placeType"];
    setPostsBusy(true); setPostsError("");
    try {
      const response = await fetch("/api/posts", { method: editingPostId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: editingPostId, title: postTitle.trim(), placeType }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "ذخیره سمت انجام نشد.");
      setFormOpen(false); await loadPosts();
    } catch (error) { setPostsError(error instanceof Error ? error.message : "ذخیره سمت انجام نشد."); }
    finally { setPostsBusy(false); }
  };

  const deletePost = async (post: OrganizationalPost) => {
    if (!window.confirm(`سمت «${post.title}» حذف شود؟`)) return;
    setPostsBusy(true); setPostsError("");
    try { const response = await fetch(`/api/posts?id=${encodeURIComponent(post.postId)}`, { method: "DELETE" }); const result = await response.json() as { message?: string }; if (!response.ok) throw new Error(result.message || "حذف سمت انجام نشد."); await loadPosts(); }
    catch (error) { setPostsError(error instanceof Error ? error.message : "حذف سمت انجام نشد."); }
    finally { setPostsBusy(false); }
  };

  return (
    <div className="app-shell" data-theme={theme}>
      {sidebarOpen && <button className="mobile-overlay" aria-label="بستن منو" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span>م</span></div>
          <div><p className="title-font brand-title">سامانه جامع مرآت</p><p className="brand-subtitle">مدیریت یکپارچه انتخابات</p></div>
          <button className="icon-button sidebar-close" aria-label="بستن منو" onClick={() => setSidebarOpen(false)}><Icon name="close" /></button>
        </div>

        <nav className="sidebar-nav" aria-label="منوی اصلی">
          {menuGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-label">{group.title}</p>
              {group.items.map((item) => {
                const isOpen = openMenus.includes(item.title);
                return (
                  <div className={`nav-block ${isOpen ? "open" : ""}`} key={item.title}>
                    <button
                      className={`nav-item ${(item.title === "پیشخوان" && currentView === "dashboard") || (item.title === "اطلاعات پایه" && (currentView === "posts" || currentView === "definitions")) || (item.title === "کاربران و دسترسی‌ها" && (currentView === "persons" || currentView === "users")) || (item.title === "داوطلبان انتخابات" && currentView === "candidates") ? "active" : ""}`}
                      aria-expanded={item.children ? isOpen : undefined}
                      onClick={() => {
                        if (item.children) toggleMenu(item.title);
                        else if (item.title === "پیشخوان") setCurrentView("dashboard");
                        setSidebarOpen(false);
                      }}
                    >
                      <span className="nav-icon"><Icon name={item.icon} /></span><span>{item.title}</span>
                      {item.badge && <span className="nav-badge">{item.badge}</span>}
                      {item.children && <span className="menu-chevron"><Icon name="arrow" size={15} /></span>}
                    </button>
                    {item.children && (
                      <div className="submenu" aria-hidden={!isOpen}>
                        {item.children.map((child) => (
                          <button
                            className={`submenu-item ${(child.title === "پست‌های سازمانی" && currentView === "posts") || (child.title === "تعاریف پایه" && currentView === "definitions") || (child.title === "فهرست اشخاص" && currentView === "persons") || (child.title === "فهرست کاربران" && currentView === "users") || (child.title === "اشخاص" && currentView === "candidates") ? "active" : ""}`}
                            key={child.title}
                            onClick={() => {
                              if (child.title === "پست‌های سازمانی") setCurrentView("posts");
                              if (child.title === "تعاریف پایه") setCurrentView("definitions");
                              if (child.title === "فهرست اشخاص") setCurrentView("persons");
                              if (child.title === "فهرست کاربران") setCurrentView("users");
                              if (child.title === "اشخاص") setCurrentView("candidates");
                              setSidebarOpen(false);
                            }}
                          >
                            <span className="submenu-dot" />
                            <span>{child.title}</span>
                            {child.badge && <span className="submenu-badge">{child.badge}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="online-dot" />
          <span>ارتباط با سرور برقرار است</span>
          <div className="theme-switcher" aria-label="انتخاب رنگ سامانه">
            {themeOptions.map((option) => (
              <button key={option.name} type="button" title={option.label} aria-label={option.label} aria-pressed={theme === option.name} className={`theme-dot ${option.name} ${theme === option.name ? "active" : ""}`} onClick={() => changeTheme(option.name)} />
            ))}
          </div>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div className="topbar-right">
            <button className="icon-button menu-button" aria-label="باز کردن منو" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
            <div><h1 className="title-font page-title">{currentView === "posts" ? "پست‌های سازمانی" : currentView === "definitions" ? "تعاریف پایه" : currentView === "persons" ? "فهرست اشخاص" : currentView === "users" ? "فهرست کاربران" : currentView === "candidates" ? "اشخاص" : "پیشخوان مدیریت"}</h1><p className="breadcrumb">{currentView === "posts" ? <><span>اطلاعات پایه</span><span>/</span><span>پست‌های سازمانی</span></> : currentView === "definitions" ? <><span>اطلاعات پایه</span><span>/</span><span>تعاریف پایه</span></> : currentView === "persons" ? <><span>کاربران و دسترسی‌ها</span><span>/</span><span>فهرست اشخاص</span></> : currentView === "users" ? <><span>کاربران و دسترسی‌ها</span><span>/</span><span>فهرست کاربران</span></> : currentView === "candidates" ? <><span>داوطلبان انتخابات</span><span>/</span><span>اشخاص</span></> : <>خانه <span>/</span> پیشخوان</>}</p></div>
          </div>
          <div className="topbar-left">
            <button className="icon-button notification-button" aria-label="اعلان‌ها"><Icon name="bell" /><span className="notification-dot" /></button>
            <span className="topbar-divider" />
            <div className="date-box"><Icon name="calendar" size={18} /><span>چهارشنبه، ۵ شهریور ۱۴۰۵</span></div>
            <div className="topbar-user">
              <span className="topbar-user-avatar" aria-label="تصویر پروفایل"><Icon name="user" size={15} /></span>
              <span className="title-font">{currentUserName}</span>
              <button className="topbar-logout" aria-label="خروج از سامانه" title="خروج" onClick={logout}><Icon name="logout" size={16} /></button>
            </div>
          </div>
        </header>

        {currentView === "dashboard" ? <main className="dashboard">
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
        </main> : currentView === "posts" ? <main className="posts-page">
          <section className="posts-heading">
            <div>
              <p className="eyebrow">اطلاعات پایه</p>
              <h2 className="title-font">مدیریت پست‌های سازمانی</h2>
              <p>عنوان پست و سطح محل قابل استفاده برای هر پست را مدیریت کنید.</p>
            </div>
            <button className="primary-button" onClick={openCreatePost} disabled={postsBusy}><Icon name="plus" size={18} />افزودن سمت جدید</button>
          </section>

          <section className="posts-card">
            <div className="posts-toolbar">
              <label className="posts-search"><Icon name="search" size={18} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="جستجو در عنوان یا کد پست..." /></label>
              <SearchableDropdown
                className="posts-filter-dropdown"
                compact
                value={placeFilter}
                options={placeFilterOptions}
                onChange={setPlaceFilter}
                placeholder="انتخاب سطح محل"
                searchPlaceholder="جستجو در سطوح محل..."
                noResultText="سطحی پیدا نشد."
                ariaLabel="فیلتر سطح محل"
                menuWidth={300}
              />
            </div>
            <div className="posts-table-wrap">
              <table className="posts-table">
                <thead><tr><th>ردیف</th><th>کد پست</th><th>عنوان پست سازمانی</th><th>سطح محل</th><th className="post-actions-title">عملیات</th></tr></thead>
                <tbody>
                  {postsLoading ? <tr><td className="posts-empty" colSpan={5}>در حال دریافت سمت‌ها...</td></tr> : postsError ? <tr><td className="posts-empty" colSpan={5}>{postsError}</td></tr> : filteredPosts.map((post, index) => {
                    const place = placeTypes[post.placeType];
                    return <tr key={post.postId}>
                      <td className="muted-cell">{(index + 1).toLocaleString("fa-IR")}</td>
                      <td className="muted-cell">{post.postId.toLocaleString("fa-IR", { useGrouping: false })}</td>
                      <td><span className="post-name"><i><Icon name="briefcase" size={15} /></i>{post.title}</span></td>
                      <td><span className={`place-pill ${place.className}`}>{place.title}</span></td>
                      <td><span className="post-actions"><button aria-label={`ویرایش ${post.title}`} disabled={postsBusy} onClick={() => openEditPost(post)}><Icon name="edit" size={17} /></button><button className="delete" disabled={postsBusy} aria-label={`حذف ${post.title}`} onClick={() => void deletePost(post)}><Icon name="trash" size={17} /></button></span></td>
                    </tr>;
                  })}
                  {!postsLoading && !postsError && filteredPosts.length === 0 && <tr><td className="posts-empty" colSpan={5}>سمتی با این مشخصات پیدا نشد.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="posts-footer"><span>نمایش {filteredPosts.length.toLocaleString("fa-IR")} مورد از {posts.length.toLocaleString("fa-IR")} پست</span><span className="posts-pagination"><button><Icon name="arrow" size={14} /></button><button className="current">۱</button><button><Icon name="arrow" size={14} /></button></span></div>
          </section>
        </main> : currentView === "definitions" ? <BaseDefinitions /> : currentView === "persons" ? <Persons /> : currentView === "users" ? <UsersTree /> : <ElectionCandidates />}
      </div>

      {formOpen && <div className="post-modal-backdrop" role="presentation" onMouseDown={() => setFormOpen(false)}>
        <section className="post-modal" role="dialog" aria-modal="true" aria-labelledby="post-modal-title" onMouseDown={(event) => event.stopPropagation()}>
          <button className="post-modal-close" aria-label="بستن" onClick={() => setFormOpen(false)}><Icon name="close" size={19} /></button>
          <div className="post-modal-header"><span className="modal-symbol"><Icon name="briefcase" size={21} /></span><div><h3 id="post-modal-title" className="title-font">{editingPostId ? "ویرایش پست سازمانی" : "افزودن پست سازمانی"}</h3><p>عنوان پست و سطح محل قابل استفاده را مشخص کنید.</p></div></div>
          <div className="post-form-field"><label htmlFor="post-title">عنوان پست</label><input id="post-title" autoFocus value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="برای نمونه: رئیس دفتر استان" /></div>
          <div className="post-form-field"><label>سطح محل</label><SearchableDropdown value={postPlaceType} options={postPlaceOptions} onChange={setPostPlaceType} placeholder="انتخاب سطح محل" searchPlaceholder="جستجو در سطوح محل..." noResultText="سطحی پیدا نشد." ariaLabel="انتخاب سطح محل پست" menuWidth={420} /></div>
          <div className="post-modal-actions"><button className="cancel-button" disabled={postsBusy} onClick={() => setFormOpen(false)}>انصراف</button><button className="primary-button" disabled={postsBusy} onClick={() => void savePost()}>{postsBusy ? "در حال ذخیره..." : editingPostId ? "ثبت تغییرات" : "ثبت سمت"}</button></div>
        </section>
      </div>}
    </div>
  );
}
