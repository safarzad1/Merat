"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

interface Props {
  label?: string;
  value?: string;
  onChange?: (date: string | null) => void;
  allowPastDates?: boolean;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  requiredStarColor?: string;
  disabled?: boolean;
}

const InputPersianDate = ({
  label,
  value,
  onChange,
  allowPastDates = false,
  error,
  errorMessage,
  required = false,
  requiredStarColor = "text-red-600",
  disabled = false,
}: Props) => {
  const today = new DateObject({ calendar: persian, locale: persian_fa });

  const selectedDate = useMemo(
    () => value ? new DateObject({ date: value, calendar: persian, locale: persian_fa }) : null,
    [value],
  );

  const handleChange = (date: DateObject | null) => {
    onChange?.(date ? date.format("YYYY/MM/DD") : null);
  };

  // ✅ تنظیم دقیق ارتفاع برای هماهنگی با Dropdown (34px)
  const inputClasses = `
    w-full
    text-[15px]
    h-[34px] 
    leading-[34px] 
    rounded-[8px]
    border
    bg-white
    px-3
    mt-1
    text-right
    outline-none
    transition-colors
    duration-200
    box-border
    ${error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"}
    ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
  `;

  return (
    <div className="flex flex-col my-0 w-full">
      {label && (
        <label className="text-right mb-1 transition-colors duration-200 inline-flex items-center justify-start gap-1 text-gray-700 text-sm font-semibold">
          {label}
          {required && <span className={`text-[14px] ${requiredStarColor}`}>*</span>}
        </label>
      )}

      <DatePicker
        calendar={persian}
        locale={persian_fa}
        value={selectedDate}
        onChange={handleChange}
        disabled={disabled}
        minDate={
          allowPastDates
            ? undefined
            : today
        }
        inputClass={inputClasses}
        placeholder="انتخاب تاریخ..."
        calendarPosition="bottom-right"

        portal
        zIndex={999999}
        fixMainPosition
        fixRelativePosition
      />

      <AnimatePresence>
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25 }}
            className="text-red-600 text-sm mt-2 text-right font-medium"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputPersianDate;
