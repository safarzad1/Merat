"use client";

import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";

import styles from "./login.module.css";

type IconName = "user" | "lock" | "eye" | "eyeOff" | "arrow" | "shield";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.7" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8M6.2 6.3C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9.7 9.7 0 0 0 3-.5" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
    shield: <><path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [imageAvailable, setImageAvailable] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });
      const result = await response.json() as { message?: string };

      if (!response.ok) {
        setError(result.message || "ورود به سامانه انجام نشد.");
        return;
      }

      window.location.assign("/");
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginCanvas}>
      <div className={styles.loginCard}>
        <section className={styles.formSide}>
        <div className={styles.formWrapper}>
          <header className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">م</span>
            <span>
              <strong>سامانه جامع مرآت</strong>
              <small>مدیریت یکپارچه انتخابات</small>
            </span>
          </header>

          <div className={styles.heading}>
            <span className={styles.eyebrow}>ورود به سامانه</span>
            <h1>خوش آمدید</h1>
            <p>برای ورود به حساب کاربری، اطلاعات خود را وارد کنید.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>نام کاربر یا کد ملی</span>
              <span className={styles.inputBox}>
                <span className={styles.inputIcon}><Icon name="user" /></span>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="نام کاربر (UserId) یا کد ملی را وارد کنید"
                  aria-label="نام کاربر یا کد ملی"
                  required
                  disabled={loading}
                />
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>کلمه عبور</span>
              <span className={styles.inputBox}>
                <span className={styles.inputIcon}><Icon name="lock" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="کلمه عبور خود را وارد کنید"
                  aria-label="کلمه عبور"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "مخفی کردن کلمه عبور" : "نمایش کلمه عبور"}
                  disabled={loading}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={19} />
                </button>
              </span>
            </label>

            <div className={styles.formOptions}>
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={loading}
                />
                <span>مرا به خاطر بسپار</span>
              </label>
              <button className={styles.forgotButton} type="button">کلمه عبور را فراموش کرده‌اید؟</button>
            </div>

            {error && <p className={styles.loginError} role="alert">{error}</p>}

            <button className={styles.submitButton} type="submit" disabled={loading}>
              <span>{loading ? "در حال بررسی..." : "ورود به سامانه"}</span>
              <Icon name="arrow" size={19} />
            </button>
          </form>

          <footer className={styles.formFooter}>
            <Icon name="shield" size={17} />
            <span>اطلاعات شما با استانداردهای امنیتی محافظت می‌شود.</span>
          </footer>
        </div>
        </section>

        <section className={styles.imageSide} aria-label="تصویر سامانه مرآت">
          {imageAvailable ? (
            <Image
              src="/login/pic-input.jpg"
              alt="سامانه جامع مرآت"
              fill
              priority
              sizes="(max-width: 900px) 0px, 50vw"
              className={styles.coverImage}
              onError={() => setImageAvailable(false)}
            />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true">
              <span className={styles.fallbackMark}>م</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
