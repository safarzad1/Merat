"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SearchableDropdown, type DropdownOption } from "../Dropdown";
import InlinePersianDatePicker from "../InlinePersianDatePicker/InlinePersianDatePicker";
import styles from "./Persons.module.css";

type PersonItem = {
  PersonId: string;
  ShomarehParvandeh: string | null;
  CodeMelli: string;
  SerialKartMelli: string | null;
  TelHamrah: string | null;
  FirstName: string;
  LastName: string;
  FatherName: string | null;
  TarikhTavalod: string | null;
  ShomareShenasnameh: string | null;
  SerialShenasnameh: string | null;
  MahalTavalod: number | null;
  MahalTavalodName: string | null;
  MahalSodor: number | null;
  MahalSodorName: string | null;
  Jensiyat: number | null;
  Taahol: number | null;
  Din_Mazhab: number | null;
  IsActive: boolean;
  PhoneNumber: string | null;
  Mahal: number;
  MahalName: string | null;
  HasPhoto: boolean;
  CreateDateTime: string;
};

type PersonForm = {
  personId: string | null;
  shomarehParvandeh: string;
  codeMelli: string;
  serialKartMelli: string;
  telHamrah: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  tarikhTavalod: string;
  shomareShenasnameh: string;
  serialShenasnameh: string;
  mahalTavalod: string;
  mahalSodor: string;
  jensiyat: string;
  taahol: string;
  dinMazhab: string;
  isActive: boolean;
  phoneNumber: string;
  mahal: string;
};

type IconName = "plus" | "search" | "edit" | "trash" | "close" | "refresh" | "user" | "arrow" | "camera";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    edit: <><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="m18.4 2.6 3 3L12 15l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 3h6l1 4H8Z" /><path d="m6 7 1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    refresh: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0-2 5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
    camera: <><path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="4" /></>,
  } as const;

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const emptyForm: PersonForm = {
  personId: null,
  shomarehParvandeh: "",
  codeMelli: "",
  serialKartMelli: "",
  telHamrah: "",
  firstName: "",
  lastName: "",
  fatherName: "",
  tarikhTavalod: "",
  shomareShenasnameh: "",
  serialShenasnameh: "",
  mahalTavalod: "",
  mahalSodor: "",
  jensiyat: "",
  taahol: "",
  dinMazhab: "",
  isActive: true,
  phoneNumber: "",
  mahal: "",
};

const statusOptions: DropdownOption<string>[] = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "1", label: "فعال" },
  { value: "0", label: "غیرفعال" },
];

const genderOptions: DropdownOption<string>[] = [
  { value: "", label: "انتخاب نشده" },
  { value: "1", label: "مرد" },
  { value: "2", label: "زن" },
];

const maritalOptions: DropdownOption<string>[] = [
  { value: "", label: "انتخاب نشده" },
  { value: "1", label: "مجرد" },
  { value: "2", label: "متأهل" },
];

async function responseMessage(response: Response) {
  try {
    const result = await response.json() as { message?: string };
    return result.message || "عملیات با خطا مواجه شد.";
  } catch {
    return "عملیات با خطا مواجه شد.";
  }
}

function numericInput(value: string, maxLength: number) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, maxLength);
}

function isValidNationalCode(value: string) {
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) return false;
  const check = Number(value[9]);
  const sum = value.slice(0, 9).split("").reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  return check === (remainder < 2 ? remainder : 11 - remainder);
}

function isValidMobile(value: string) {
  return /^09\d{9}$/.test(value);
}

export default function Persons() {
  const [items, setItems] = useState<PersonItem[]>([]);
  const [countyLocations, setCountyLocations] = useState<DropdownOption<string>[]>([]);
  const [religionOptions, setReligionOptions] = useState<DropdownOption<string>[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ codeMelli?: string; telHamrah?: string }>({});
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PersonForm>(emptyForm);
  const [formStep, setFormStep] = useState(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const loadPersons = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (searchText.trim()) params.set("search", searchText.trim());
    if (activeFilter !== "all") params.set("active", activeFilter);

    try {
      const response = await fetch(`/api/persons?${params}`, { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(await responseMessage(response));
      const result = await response.json() as { items?: PersonItem[]; totalCount?: string };
      setItems(Array.isArray(result.items) ? result.items : []);
      setTotalCount(Number(result.totalCount ?? 0));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "دریافت اطلاعات انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, pageSize, searchText]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPersons(), 250);
    return () => window.clearTimeout(timer);
  }, [loadPersons]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const [countyResponse, religionResponse] = await Promise.all([
          fetch("/api/persons/locations?countyOnly=1", { cache: "no-store" }),
          fetch("/api/persons/definitions?parentId=205", { cache: "no-store" }),
        ]);
        const toOptions = async (response: Response) => {
          if (!response.ok) return [];
          const result = await response.json() as { items?: { Value: string; Label: string; Description?: string }[] };
          return (result.items ?? []).map((item) => ({ value: String(item.Value), label: item.Label, description: item.Description }));
        };
        const [countyOptions, religions] = await Promise.all([toOptions(countyResponse), toOptions(religionResponse)]);
        setCountyLocations([{ value: "", label: "انتخاب نشده" }, ...countyOptions]);
        setReligionOptions([{ value: "", label: "انتخاب نشده" }, ...religions]);
      } catch {
        setCountyLocations([{ value: "", label: "انتخاب نشده" }]);
        setReligionOptions([{ value: "", label: "انتخاب نشده" }]);
      }
    };
    void loadLocations();
  }, []);

  useEffect(() => () => {
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const serviceLocations = useMemo(() => countyLocations.filter((option) => option.value !== ""), [countyLocations]);

  const updateForm = <K extends keyof PersonForm>(key: K, value: PersonForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "codeMelli" || key === "telHamrah") setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateNationalCodeField = () => {
    const message = isValidNationalCode(form.codeMelli.trim()) ? undefined : "کد ملی واردشده معتبر نیست.";
    setFieldErrors((current) => ({ ...current, codeMelli: message }));
    return !message;
  };

  const validateMobileField = () => {
    const value = form.telHamrah.trim();
    const message = value && !isValidMobile(value) ? "شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد." : undefined;
    setFieldErrors((current) => ({ ...current, telHamrah: message }));
    return !message;
  };

  const clearLocalPhotoPreview = () => {
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  };

  const resetPhoto = (preview = "") => {
    clearLocalPhotoPreview();
    setPhotoFile(null);
    setPhotoPreview(preview);
    setRemovePhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const openCreate = () => {
    setForm(emptyForm);
    resetPhoto();
    setFormStep(1);
    setFormError("");
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: PersonItem) => {
    resetPhoto(item.HasPhoto ? `/api/persons/photo?id=${encodeURIComponent(item.PersonId)}` : "");
    setForm({
      personId: item.PersonId,
      shomarehParvandeh: item.ShomarehParvandeh ?? "",
      codeMelli: item.CodeMelli ?? "",
      serialKartMelli: item.SerialKartMelli ?? "",
      telHamrah: item.TelHamrah ?? "",
      firstName: item.FirstName ?? "",
      lastName: item.LastName ?? "",
      fatherName: item.FatherName ?? "",
      tarikhTavalod: item.TarikhTavalod?.trim() ?? "",
      shomareShenasnameh: item.ShomareShenasnameh ?? "",
      serialShenasnameh: item.SerialShenasnameh ?? "",
      mahalTavalod: item.MahalTavalod === null ? "" : String(item.MahalTavalod),
      mahalSodor: item.MahalSodor === null ? "" : String(item.MahalSodor),
      jensiyat: item.Jensiyat === null ? "" : String(item.Jensiyat),
      taahol: item.Taahol === null ? "" : String(item.Taahol),
      dinMazhab: item.Din_Mazhab === null ? "" : String(item.Din_Mazhab),
      isActive: Boolean(item.IsActive),
      phoneNumber: item.PhoneNumber ?? "",
      mahal: String(item.Mahal),
    });
    setFormStep(1);
    setFormError("");
    setFieldErrors({});
    setFormOpen(true);
  };

  const selectPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("فقط تصویر JPG، PNG یا WEBP قابل انتخاب است.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("حجم تصویر باید حداکثر ۱۰ مگابایت باشد.");
      return;
    }
    clearLocalPhotoPreview();
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
    setFormError("");
  };

  const deleteSelectedPhoto = () => {
    clearLocalPhotoPreview();
    setPhotoFile(null);
    setPhotoPreview("");
    setRemovePhoto(Boolean(form.personId));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const closeForm = () => {
    if (busy) return;
    resetPhoto();
    setFormOpen(false);
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) return "نام و نام خانوادگی الزامی است.";
      if (!isValidNationalCode(form.codeMelli.trim())) return "کد ملی واردشده معتبر نیست.";
      if (!form.tarikhTavalod) return "تاریخ تولد الزامی است.";
      if (!form.jensiyat) return "جنسیت را انتخاب کنید.";
      if (!form.taahol) return "وضعیت تأهل را انتخاب کنید.";
      if (!form.dinMazhab) return "دین و مذهب را انتخاب کنید.";
    }
    if (step === 2) {
      if (form.telHamrah.trim() && !isValidMobile(form.telHamrah.trim())) return "شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
      if (!form.mahal) return "محل خدمت را انتخاب کنید.";
    }
    return "";
  };

  const nextStep = () => {
    const validationError = validateStep(formStep);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");
    setFormStep((current) => Math.min(2, current + 1));
  };

  const savePerson = async () => {
    if (!isValidNationalCode(form.codeMelli.trim())) {
      validateNationalCodeField();
      setFormError("کد ملی واردشده معتبر نیست.");
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("نام و نام خانوادگی الزامی است.");
      return;
    }
    if (!form.mahal) {
      setFormError("محل خدمت را انتخاب کنید.");
      return;
    }
    if (!form.tarikhTavalod || !form.jensiyat || !form.taahol || !form.dinMazhab) {
      setFormError("تاریخ تولد، جنسیت، وضعیت تأهل و دین و مذهب الزامی هستند.");
      setFormStep(1);
      return;
    }
    if (form.telHamrah.trim() && !isValidMobile(form.telHamrah.trim())) {
      validateMobileField();
      setFormError("شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد.");
      return;
    }

    setBusy(true);
    setFormError("");
    try {
      const response = await fetch("/api/persons", {
        method: form.personId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(await responseMessage(response));
      const result = await response.json() as { personId?: string };
      const savedPersonId = form.personId ?? result.personId;
      if (!savedPersonId) throw new Error("شناسه شخص پس از ذخیره دریافت نشد.");

      if (photoFile) {
        const photoData = new FormData();
        photoData.append("personId", savedPersonId);
        photoData.append("photo", photoFile);
        const photoResponse = await fetch("/api/persons/photo", { method: "POST", body: photoData });
        if (!photoResponse.ok) throw new Error(`اطلاعات شخص ذخیره شد؛ ${await responseMessage(photoResponse)}`);
      } else if (removePhoto && form.personId) {
        const photoResponse = await fetch(`/api/persons/photo?id=${encodeURIComponent(form.personId)}`, { method: "DELETE" });
        if (!photoResponse.ok) throw new Error(`اطلاعات شخص ذخیره شد؛ ${await responseMessage(photoResponse)}`);
      }

      resetPhoto();
      setFormOpen(false);
      await loadPersons();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "ذخیره اطلاعات انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const deletePerson = async (item: PersonItem) => {
    if (!window.confirm(`شخص «${item.FirstName} ${item.LastName}» حذف شود؟`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/persons?id=${encodeURIComponent(item.PersonId)}`, { method: "DELETE" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(await responseMessage(response));
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadPersons();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "حذف شخص انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.heading}>
        <div><span>کاربران و دسترسی‌ها</span><h2>مدیریت اشخاص</h2><p>مشخصات هویتی، تماس و محل خدمت اشخاص را مدیریت کنید.</p></div>
        <button className={styles.primaryButton} onClick={openCreate} disabled={busy}><Icon name="plus" />افزودن شخص جدید</button>
      </section>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.search}><Icon name="search" /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1); }} placeholder="جستجو در نام، کد ملی، موبایل یا شماره پرونده..." /></label>
          <SearchableDropdown className={styles.statusFilter} compact value={activeFilter} options={statusOptions} onChange={(value) => { setActiveFilter(value); setPage(1); }} ariaLabel="فیلتر وضعیت شخص" menuWidth={250} />
          <button className={styles.refreshButton} onClick={() => void loadPersons()} disabled={loading || busy}><Icon name="refresh" />به‌روزرسانی</button>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>ردیف</th><th>شخص</th><th>کد ملی</th><th>شماره پرونده</th><th>شماره همراه</th><th>محل خدمت</th><th>وضعیت</th><th className={styles.actionsTitle}>عملیات</th></tr></thead>
            <tbody>
              {loading ? <tr><td className={styles.empty} colSpan={8}>در حال دریافت اطلاعات...</td></tr> : items.length === 0 ? <tr><td className={styles.empty} colSpan={8}>شخصی برای نمایش پیدا نشد.</td></tr> : items.map((item, index) => (
                <tr key={item.PersonId}>
                  <td className={styles.muted}>{(((page - 1) * pageSize) + index + 1).toLocaleString("fa-IR")}</td>
                  <td><span className={styles.personName}><i className={styles.listPhoto}>{item.HasPhoto ? <img src={`/api/persons/photo?id=${encodeURIComponent(item.PersonId)}`} alt="" /> : <Icon name="user" size={16} />}</i><span>{item.FirstName} {item.LastName}<small>{item.FatherName ? `فرزند ${item.FatherName}` : `شناسه ${item.PersonId}`}</small></span></span></td>
                  <td><span className={styles.codeBadge}>{item.CodeMelli}</span></td>
                  <td>{item.ShomarehParvandeh ?? <span className={styles.noValue}>—</span>}</td>
                  <td>{item.TelHamrah ?? <span className={styles.noValue}>—</span>}</td>
                  <td className={styles.locationCell}>{item.MahalName || item.Mahal}</td>
                  <td><span className={`${styles.status} ${item.IsActive ? styles.active : styles.inactive}`}>{item.IsActive ? "فعال" : "غیرفعال"}</span></td>
                  <td><span className={styles.actions}><button className={styles.editButton} onClick={() => openEdit(item)} disabled={busy} aria-label={`ویرایش ${item.FirstName} ${item.LastName}`}><Icon name="edit" size={17} /></button><button className={styles.deleteButton} onClick={() => void deletePerson(item)} disabled={busy} aria-label={`حذف ${item.FirstName} ${item.LastName}`}><Icon name="trash" size={17} /></button></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <span>نمایش {items.length.toLocaleString("fa-IR")} مورد از {totalCount.toLocaleString("fa-IR")} شخص</span>
          <div className={styles.pagination}><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} aria-label="صفحه قبل"><Icon name="arrow" size={15} /></button><span>صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}</span><button className={styles.nextButton} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount || loading} aria-label="صفحه بعد"><Icon name="arrow" size={15} /></button></div>
        </footer>
      </section>

      {formOpen && (
        <div className={styles.backdrop} onMouseDown={closeForm}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="person-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeForm} disabled={busy} aria-label="بستن"><Icon name="close" /></button>
            <header className={styles.modalHeader}><span><Icon name="user" size={21} /></span><div><h3 id="person-modal-title">{form.personId ? "ویرایش مشخصات شخص" : "افزودن شخص جدید"}</h3><p>اطلاعات هویتی، تماس و محل‌های مرتبط را وارد کنید.</p></div></header>

            <nav className={styles.wizardSteps} aria-label="مراحل ثبت شخص">
              {["اطلاعات هویتی و سجلی", "تماس و محل‌ها"].map((title, index) => {
                const step = index + 1;
                return <button type="button" key={title} className={`${formStep === step ? styles.currentStep : ""} ${formStep > step ? styles.completedStep : ""}`} onClick={() => step < formStep && setFormStep(step)} disabled={step > formStep || busy}><span>{step.toLocaleString("fa-IR")}</span><i>{title}</i></button>;
              })}
            </nav>

            {formError && <div className={styles.error} role="alert">{formError}</div>}

            <div className={styles.formBody}>
              {formStep === 1 && <section className={styles.formSection}><h4>مرحله اول: اطلاعات اصلی و هویتی</h4><div className={styles.identityStep}>
                <div className={styles.photoPanel}>
                  <div className={styles.photoPreview}>{photoPreview ? <img src={photoPreview} alt="پیش‌نمایش تصویر پرسنلی" /> : <span><Icon name="user" size={42} /><small>تصویر پرسنلی</small></span>}</div>
                  <input ref={photoInputRef} className={styles.hiddenFileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectPhoto(event.target.files?.[0])} />
                  <button type="button" className={styles.photoButton} onClick={() => photoInputRef.current?.click()} disabled={busy}><Icon name="camera" size={16} />{photoPreview ? "تعویض تصویر" : "انتخاب تصویر"}</button>
                  {photoPreview && <button type="button" className={styles.removePhotoButton} onClick={deleteSelectedPhoto} disabled={busy}>حذف تصویر</button>}
                  <p>JPG، PNG یا WEBP تا ۱۰ مگابایت</p>
                </div>
                <div className={styles.formGrid}>
                  <label><span>نام <b>*</b></span><input autoFocus value={form.firstName} onChange={(event) => updateForm("firstName", event.target.value)} maxLength={100} /></label>
                  <label><span>نام خانوادگی <b>*</b></span><input value={form.lastName} onChange={(event) => updateForm("lastName", event.target.value)} maxLength={200} /></label>
                  <label><span>نام پدر</span><input value={form.fatherName} onChange={(event) => updateForm("fatherName", event.target.value)} maxLength={100} /></label>
                  <label><span>کد ملی <b>*</b></span><input className={fieldErrors.codeMelli ? styles.invalidField : ""} value={form.codeMelli} onChange={(event) => updateForm("codeMelli", numericInput(event.target.value, 10))} onBlur={validateNationalCodeField} maxLength={10} inputMode="numeric" aria-invalid={Boolean(fieldErrors.codeMelli)} />{fieldErrors.codeMelli && <small className={styles.fieldError}>{fieldErrors.codeMelli}</small>}</label>
                  <label><span>شماره پرونده</span><input value={form.shomarehParvandeh} onChange={(event) => updateForm("shomarehParvandeh", event.target.value)} inputMode="numeric" /></label>
                  <label><span>سریال کارت ملی</span><input value={form.serialKartMelli} onChange={(event) => updateForm("serialKartMelli", event.target.value)} maxLength={30} /></label>
                  <label><span>تاریخ تولد <b>*</b></span><InlinePersianDatePicker value={form.tarikhTavalod} onChange={(value) => updateForm("tarikhTavalod", value)} disallowFuture clearable ariaLabel="تاریخ تولد" /></label>
                  <label><span>شماره شناسنامه</span><input value={form.shomareShenasnameh} onChange={(event) => updateForm("shomareShenasnameh", event.target.value)} maxLength={30} /></label>
                  <label><span>سریال شناسنامه</span><input value={form.serialShenasnameh} onChange={(event) => updateForm("serialShenasnameh", event.target.value)} maxLength={30} /></label>
                  <label><span>جنسیت <b>*</b></span><SearchableDropdown value={form.jensiyat} options={genderOptions} onChange={(value) => updateForm("jensiyat", value)} ariaLabel="انتخاب جنسیت" menuWidth={280} /></label>
                  <label><span>وضعیت تأهل <b>*</b></span><SearchableDropdown value={form.taahol} options={maritalOptions} onChange={(value) => updateForm("taahol", value)} ariaLabel="انتخاب وضعیت تأهل" menuWidth={280} /></label>
                  <label><span>دین و مذهب <b>*</b></span><SearchableDropdown value={form.dinMazhab} options={religionOptions} onChange={(value) => updateForm("dinMazhab", value)} searchPlaceholder="جستجوی دین و مذهب..." ariaLabel="انتخاب دین و مذهب" menuWidth={320} /></label>
                </div>
              </div></section>}

              {formStep === 2 && <section className={styles.formSection}><h4>مرحله دوم: تماس، محل‌ها و وضعیت</h4><div className={styles.formGrid}>
                <label><span>شماره همراه</span><input className={fieldErrors.telHamrah ? styles.invalidField : ""} value={form.telHamrah} onChange={(event) => updateForm("telHamrah", numericInput(event.target.value, 11))} onBlur={validateMobileField} maxLength={11} inputMode="numeric" aria-invalid={Boolean(fieldErrors.telHamrah)} />{fieldErrors.telHamrah && <small className={styles.fieldError}>{fieldErrors.telHamrah}</small>}</label>
                <label><span>تلفن ثابت</span><input value={form.phoneNumber} onChange={(event) => updateForm("phoneNumber", event.target.value)} maxLength={20} inputMode="tel" /></label>
                <label><span>محل تولد (شهرستان)</span><SearchableDropdown value={form.mahalTavalod} options={countyLocations} onChange={(value) => updateForm("mahalTavalod", value)} searchPlaceholder="جستجوی شهرستان محل تولد..." ariaLabel="انتخاب شهرستان محل تولد" menuWidth={420} /></label>
                <label><span>محل صدور (شهرستان)</span><SearchableDropdown value={form.mahalSodor} options={countyLocations} onChange={(value) => updateForm("mahalSodor", value)} searchPlaceholder="جستجوی شهرستان محل صدور..." ariaLabel="انتخاب شهرستان محل صدور" menuWidth={420} /></label>
                <label className={styles.wideField}><span>محل خدمت (شهرستان) <b>*</b></span><SearchableDropdown value={form.mahal} options={serviceLocations} onChange={(value) => updateForm("mahal", value)} searchPlaceholder="جستجوی شهرستان محل خدمت..." noResultText="شهرستانی پیدا نشد." ariaLabel="انتخاب شهرستان محل خدمت" menuWidth={520} /></label>
                <label className={styles.switchField}><input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} /><span>شخص فعال باشد</span></label>
              </div></section>}
            </div>

            <footer className={styles.modalActions}>
              <div><button className={styles.cancelButton} onClick={closeForm} disabled={busy}>انصراف</button>{formStep > 1 && <button className={styles.previousButton} onClick={() => { setFormError(""); setFormStep((current) => Math.max(1, current - 1)); }} disabled={busy}>مرحله قبل</button>}</div>
              {formStep < 2 ? <button className={styles.primaryButton} onClick={nextStep} disabled={busy}>مرحله بعد</button> : <button className={styles.primaryButton} onClick={() => void savePerson()} disabled={busy}>{busy ? "در حال ذخیره..." : form.personId ? "ثبت تغییرات" : "ثبت شخص"}</button>}
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
