import { useState, useMemo } from "react";

interface CompletionStat {
  date: string;
  count: number;
}

interface CalendarProps {
  stats: CompletionStat[];
}

export function Calendar({ stats }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Create a map of date -> count for quick lookup
  const statsMap = useMemo(() => {
    const map = new Map<string, number>();
    stats.forEach((stat) => {
      map.set(stat.date, stat.count);
    });
    return map;
  }, [stats]);

  // Get the first day of the month and how many days it has
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

  // Get previous month's trailing days
  const prevMonth = new Date(year, month - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();
  const trailingDays: number[] = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    trailingDays.push(daysInPrevMonth - i);
  }

  // Get next month's leading days
  const totalCells = trailingDays.length + daysInMonth;
  const leadingDays: number[] = [];
  const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
  for (let i = 1; i <= remainingCells; i++) {
    leadingDays.push(i);
  }

  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const formatDateKey = (year: number, month: number, day: number): string => {
    const date = new Date(year, month, day);
    return date.toISOString().split("T")[0];
  };

  const isDateInStreak = (year: number, month: number, day: number): boolean => {
    const dateKey = formatDateKey(year, month, day);
    return statsMap.has(dateKey);
  };

  const getCompletionCount = (year: number, month: number, day: number): number => {
    const dateKey = formatDateKey(year, month, day);
    return statsMap.get(dateKey) || 0;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div
      style={{
        background: "#27272a",
        borderRadius: "12px",
        padding: "1.5rem",
        border: "1px solid #3f3f46",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#e4e4e7" }}>
          Calendar
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
            <button
            onClick={() => navigateMonth("prev")}
            style={{
              background: "transparent",
              border: "none",
              color: "#e4e4e7",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "0.25rem 0.5rem",
            }}
          >
            &lt;
          </button>
          <span style={{ color: "#e4e4e7", fontWeight: 500, minWidth: "150px", textAlign: "center" }}>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => navigateMonth("next")}
            style={{
              background: "transparent",
              border: "none",
              color: "#e4e4e7",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "0.25rem 0.5rem",
            }}
          >
            &gt;
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
        }}
      >
        {/* Day headers */}
        {dayNames.map((day, idx) => (
          <div
            key={idx}
              style={{
                textAlign: "center",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#71717a",
                padding: "0.5rem",
              }}
            >
              {day}
            </div>
          ))}

        {/* Previous month trailing days */}
        {trailingDays.map((day) => {
          const prevYear = month === 0 ? year - 1 : year;
          const prevMonthIndex = month === 0 ? 11 : month - 1;
          const inStreak = isDateInStreak(prevYear, prevMonthIndex, day);
          const count = getCompletionCount(prevYear, prevMonthIndex, day);
          return (
            <div
              key={`prev-${day}`}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background: inStreak ? "#f97316" : "transparent",
                color: inStreak ? "#ffffff" : "#71717a",
                fontSize: "0.875rem",
                fontWeight: 500,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <span>{day}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: "0.5rem",
                      color: inStreak ? "#ffffff" : "#52525b",
                      lineHeight: 1,
                    }}
                  >
                    ◆
                  </span>
                )}
              </div>
              {count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    fontSize: "0.625rem",
                    color: inStreak ? "#ffffff" : "#a1a1aa",
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}

        {/* Current month days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const inStreak = isDateInStreak(year, month, day);
          const count = getCompletionCount(year, month, day);
          const isToday =
            year === new Date().getFullYear() &&
            month === new Date().getMonth() &&
            day === new Date().getDate();
          return (
            <div
              key={day}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background: inStreak ? "#f97316" : isToday ? "#27272a" : "transparent",
                color: inStreak ? "#ffffff" : isToday ? "#ffffff" : "#e4e4e7",
                fontSize: "0.875rem",
                fontWeight: 500,
                position: "relative",
                border: isToday && !inStreak ? "1px solid #3f3f46" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <span>{day}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: "0.5rem",
                      color: inStreak ? "#ffffff" : "#52525b",
                      lineHeight: 1,
                    }}
                  >
                    ◆
                  </span>
                )}
              </div>
              {count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    fontSize: "0.625rem",
                    color: inStreak ? "#ffffff" : "#a1a1aa",
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}

        {/* Next month leading days */}
        {leadingDays.map((day) => {
          const nextYear = month === 11 ? year + 1 : year;
          const nextMonthIndex = month === 11 ? 0 : month + 1;
          const inStreak = isDateInStreak(nextYear, nextMonthIndex, day);
          const count = getCompletionCount(nextYear, nextMonthIndex, day);
          return (
            <div
              key={`next-${day}`}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background: inStreak ? "#f97316" : "transparent",
                color: inStreak ? "#ffffff" : "#71717a",
                fontSize: "0.875rem",
                fontWeight: 500,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <span>{day}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: "0.5rem",
                      color: inStreak ? "#ffffff" : "#52525b",
                      lineHeight: 1,
                    }}
                  >
                    ◆
                  </span>
                )}
              </div>
              {count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    fontSize: "0.625rem",
                    color: inStreak ? "#ffffff" : "#a1a1aa",
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

