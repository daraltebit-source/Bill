import React, { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  language: "EN" | "AR";
  name?: string;
  className?: string;
}

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const DAYS_SHORT_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_SHORT_AR = ["أح", "اث", "ثلا", "أر", "خم", "جم", "سب"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  language,
  name = "dueDate",
  className
}) => {
  const isAr = language === "AR";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsing current selected date
  const selectedDate = value ? new Date(value) : new Date();
  
  // Track displayed calendar month/year
  const [displayedMonth, setDisplayedMonth] = useState(selectedDate.getMonth());
  const [displayedYear, setDisplayedYear] = useState(selectedDate.getFullYear());

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update calendar display month when value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setDisplayedMonth(d.getMonth());
        setDisplayedYear(d.getFullYear());
      }
    }
  }, [value]);

  const handleDayClick = (day: number) => {
    // Format Month and Day with leading zeros
    const monthStr = String(displayedMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const formattedDate = `${displayedYear}-${monthStr}-${dayStr}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayedMonth === 0) {
      setDisplayedMonth(11);
      setDisplayedYear(prev => prev - 1);
    } else {
      setDisplayedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayedMonth === 11) {
      setDisplayedMonth(0);
      setDisplayedYear(prev => prev + 1);
    } else {
      setDisplayedMonth(prev => prev + 1);
    }
  };

  // Helper to format Arabic digits
  const formatNumber = (num: number | string): string => {
    if (!isAr) return String(num);
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(num).replace(/[0-9]/g, (w) => arabicDigits[+w]);
  };

  // Helper to format selected date elegantly for the display button
  const formatSelectedDateHuman = (): string => {
    if (isNaN(selectedDate.getTime())) return value;
    const day = selectedDate.getDate();
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    if (isAr) {
      return `${formatNumber(day)} ${MONTHS_AR[month]} ${formatNumber(year)}`;
    } else {
      return `${MONTHS_EN[month]} ${day}, ${year}`;
    }
  };

  // Logic to build the calendar grid
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(displayedMonth, displayedYear);
  const firstDayIndex = getFirstDayOfMonth(displayedMonth, displayedYear);

  // Total spots in grid = padding + month days
  const gridDays: { day: number | null; isCurrentMonth: boolean }[] = [];
  
  // Padding from previous month
  const prevMonth = displayedMonth === 0 ? 11 : displayedMonth - 1;
  const prevYear = displayedMonth === 0 ? displayedYear - 1 : displayedYear;
  const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    gridDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    gridDays.push({ day: d, isCurrentMonth: true });
  }

  // Padding for next month to complete the row
  const remainingSlots = 42 - gridDays.length; // 6 rows of 7 days
  for (let d = 1; d <= remainingSlots; d++) {
    gridDays.push({ day: d, isCurrentMonth: false });
  }

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === displayedMonth &&
      today.getFullYear() === displayedYear
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === displayedMonth &&
      selectedDate.getFullYear() === displayedYear
    );
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Hidden field for standard form submit compatibility */}
      <input type="hidden" name={name} value={value} />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-4 bg-[#11151C] border border-outline rounded-xl flex items-center justify-between text-on-surface hover:border-primary/50 transition-all font-medium text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
          isOpen && "border-primary ring-2 ring-primary/20",
          isAr ? "flex-row-reverse text-right" : "text-left"
        )}
      >
        <span className="font-sans text-on-surface font-semibold">
          {formatSelectedDateHuman()}
        </span>
        <CalendarIcon size={18} className="text-on-surface-variant/50 shrink-0" />
      </button>

      {/* Popover Calendar Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 left-0 right-0 mt-1 bg-[#161B22] border border-outline rounded-2xl p-4 shadow-2xl overflow-hidden",
              isAr ? "text-right" : "text-left"
            )}
          >
            {/* Header controls */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={isAr ? handleNextMonth : handlePrevMonth}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-highest border border-outline/30 flex items-center justify-center text-on-surface hover:text-primary transition-all active:scale-90"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="font-bold text-sm text-on-surface flex items-center gap-1.5 font-sans">
                <span>
                  {isAr ? MONTHS_AR[displayedMonth] : MONTHS_EN[displayedMonth]}
                </span>
                <span className="opacity-80 font-mono text-xs font-semibold text-primary">
                  {formatNumber(displayedYear)}
                </span>
              </div>

              <button
                type="button"
                onClick={isAr ? handlePrevMonth : handleNextMonth}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-highest border border-outline/30 flex items-center justify-center text-on-surface hover:text-primary transition-all active:scale-90"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Week Days row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1 border-b border-outline-variant/30 pb-2">
              {(isAr ? DAYS_SHORT_AR : DAYS_SHORT_EN).map((day, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono font-bold text-on-surface-variant/50 uppercase tracking-wider py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map((cell, idx) => {
                if (cell.day === null) {
                  return <div key={idx} />;
                }

                const currentMonthCell = cell.isCurrentMonth;
                const isDaySelected = currentMonthCell && isSelected(cell.day);
                const isDayToday = currentMonthCell && isToday(cell.day);

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!currentMonthCell}
                    onClick={() => cell.day && handleDayClick(cell.day)}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all relative font-mono",
                      !currentMonthCell && "text-on-surface-variant/10 cursor-default pointer-events-none",
                      currentMonthCell && "text-on-surface hover:bg-primary/10 hover:text-primary",
                      isDayToday && "bg-[#4285F4]/10 text-primary border border-[#4285F4]/20",
                      isDaySelected && "!bg-primary !text-on-primary shadow-lg shadow-primary/20 scale-105 font-bold"
                    )}
                  >
                    {formatNumber(cell.day)}
                    {isDayToday && !isDaySelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
