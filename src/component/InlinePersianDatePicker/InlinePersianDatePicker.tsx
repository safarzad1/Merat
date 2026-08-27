"use client";

import { useMemo } from "react";
import { CalendarDays, X } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";

import styles from "./InlinePersianDatePicker.module.css";

type InlinePersianDatePickerProps = {
  value?: string | null;
  disabled?: boolean;
  ariaLabel?: string;
  minDate?: string | null;
  disallowFuture?: boolean;
  clearable?: boolean;
  onChange: (date: string) => void;
};

function toEnglishDigits(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function createDateValue(value?: string | null) {
  const normalized = toEnglishDigits(value).trim();
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(normalized)) return null;

  try {
    return new DateObject({
      date: normalized,
      format: "YYYY/MM/DD",
      calendar: persian,
      locale: persianFa,
    });
  } catch {
    return null;
  }
}

export default function InlinePersianDatePicker({
  value,
  disabled = false,
  ariaLabel = "تاریخ هزینه",
  minDate,
  disallowFuture = false,
  clearable = false,
  onChange,
}: InlinePersianDatePickerProps) {
  const selectedDate = useMemo(() => createDateValue(value), [value]);
  const minimumDate = useMemo(() => createDateValue(minDate), [minDate]);
  const maximumDate = useMemo(
    () =>
      disallowFuture
        ? new DateObject({
            date: new Date(),
            calendar: persian,
            locale: persianFa,
          })
        : undefined,
    [disallowFuture],
  );

  return (
    <div className={styles.wrapper} aria-label={ariaLabel}>
      <DatePicker
        value={selectedDate}
        calendar={persian}
        locale={persianFa}
        format="YYYY/MM/DD"
        minDate={minimumDate ?? undefined}
        maxDate={maximumDate}
        onChange={(date) => {
          if (!date || Array.isArray(date)) return;
          const normalized = toEnglishDigits(date.format("YYYY/MM/DD")).trim();
          if (/^\d{4}\/\d{2}\/\d{2}$/.test(normalized)) onChange(normalized);
        }}
        editable={false}
        disabled={disabled}
        placeholder="انتخاب تاریخ"
        calendarPosition="bottom-right"
        portal
        zIndex={2147483647}
        fixMainPosition
        fixRelativePosition
        containerClassName={styles.container}
        inputClass={`${styles.input} ${clearable ? styles.clearableInput : ""}`}
        className={styles.calendar}
      />
      {clearable && value && !disabled ? (
        <button
          type="button"
          className={styles.clearButton}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange("");
          }}
          aria-label={`پاک کردن ${ariaLabel}`}
          title="پاک کردن تاریخ"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
      <CalendarDays className={styles.icon} size={17} aria-hidden="true" />
    </div>
  );
}
