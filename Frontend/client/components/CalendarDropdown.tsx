import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarDropdown({
  onClose,
  onSelect,
  selectedRange: externalRange,
}: {
  onClose: () => void;
  onSelect: (range: { start: Date; end: Date }) => void;
  selectedRange?: { start: Date | null; end: Date | null };
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>(externalRange || { start: null, end: null });

  useEffect(() => {
    if (externalRange) setSelectedRange(externalRange);
  }, [externalRange]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isInRange = (date: Date) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isRangeStart = (date: Date) =>
    selectedRange.start && date.getTime() === selectedRange.start.getTime();

  const isRangeEnd = (date: Date) =>
    selectedRange.end && date.getTime() === selectedRange.end.getTime();

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      const newRange = { start: date, end: null };
      setSelectedRange(newRange);
      // Removed onSelect call on first click to allow selecting a range
    } else if (selectedRange.start && !selectedRange.end) {
      const range =
        date >= selectedRange.start
          ? { start: selectedRange.start, end: date }
          : { start: date, end: selectedRange.start };
      setSelectedRange(range);
      onSelect({ start: range.start, end: range.end });
    }
  };

  const handleDone = () => {
    if (selectedRange.start && selectedRange.end) {
      onSelect({ start: selectedRange.start, end: selectedRange.end });
    } else if (selectedRange.start) {
      onSelect({ start: selectedRange.start, end: selectedRange.start });
    }
    onClose();
  };

  const renderCalendar = (monthOffset: number) => {
    const displayMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + monthOffset
    );
    const days = getDaysInMonth(displayMonth);

    const isToday = (date: Date) => {
      const now = new Date();
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    };

    return (
      <div className="z-50 w-full md:w-[300px] md:h-[200px] flex flex-col gap-4 font-plus-jakarta">
        <div className="flex justify-between items-center w-full relative">
          {monthOffset === 0 && (
            <button 
              onClick={prevMonth} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-30 absolute left-0"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <h3 className="text-md font-semibold text-center flex-1 text-gray-900 dark:text-gray-100">
            {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
          </h3>
          {monthOffset === 1 ? (
            <button 
              onClick={nextMonth} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-30 absolute right-0"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          ) : (
            <button 
              onClick={nextMonth} 
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-30 absolute right-0"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center"
            >
              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium uppercase tracking-wider">{day}</span>
            </div>
          ))}

          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
            const inRange = isInRange(day);
            const rangeStart = isRangeStart(day);
            const rangeEnd = isRangeEnd(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                className={`h-8 md:h-10 relative flex items-center justify-center ${!isCurrentMonth ? "invisible" : ""}`}
              >
                {inRange && isCurrentMonth && (
                  <div 
                    className={`absolute inset-0 bg-primary/10 dark:bg-primary/20 
                      ${rangeStart ? "rounded-l-full" : ""} 
                      ${rangeEnd ? "rounded-r-full" : ""}
                    `} 
                  />
                )}

                <button
                  onClick={() => isCurrentMonth && handleDateClick(day)}
                  disabled={!isCurrentMonth}
                  className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center relative z-10 transition-all rounded-full text-sm md:text-base
                    ${
                      rangeStart || rangeEnd
                        ? "bg-primary text-white rounded-full shadow-md scale-105"
                        : isTodayDate
                          ? "border-2 border-primary rounded-full  text-primary font-bold"
                          : inRange
                            ? "text-primary  border rounded-full font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 md:-translate-x-1/2 mt-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl z-[9999] w-[95vw] md:w-auto max-w-[400px] md:max-w-none p-6  border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row gap-10 items-start justify-center">
        <div className="w-full md:w-auto">{renderCalendar(0)}</div>
        <div className="hidden md:block w-[1px] self-stretch bg-gray-100 dark:bg-gray-800 mx-2" />
        <div className="hidden md:block w-full md:w-auto">{renderCalendar(1)}</div>
      </div>
      <div className="flex justify-between items-center mt-16 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setSelectedRange({ start: null, end: null })}
          className="text-sm font-semibold text-gray-900 dark:text-gray-100 underline hover:text-gray-600 transition-colors"
        >
          Clear dates
        </button>
        <button
          onClick={handleDone}
          className="bg-black text-white px-10 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
