import {
  addDays,
  addHours,
  endOfDay,
  format,
  getHours,
  setHours,
  startOfDay
} from "date-fns";
import { useCallback, useEffect, useState } from "react";

const primeTimeHour = 20;

const DaysBar = ({ value, onSelect }) => {
  const [times] = useState(() => {
    const result = [];
    for (let index = -10; index < 10; index++) {
      if (index === 0) result.push([new Date(), "Now", "day"]);
      else result.push([addDays(new Date(), index), "", "day"]);
    }

    if (getHours(new Date()) + 3 < primeTimeHour + 2) {
      result.push([
        setHours(new Date(), primeTimeHour),
        "This evening",
        "primetime"
      ]);
    }

    return result.sort(([dateA], [dateB]) => dateA - dateB);
  });

  const [activeIndex, setActiveIndex] = useState();

  const handleRef = useCallback((ref) => {
    if (!ref) return;
    ref.scrollLeft = ref.offsetWidth / 2;
  }, []);

  const handleItemClick = useCallback(
    (date) => {
      const time = date.getTime();
      onSelect(time);
    },
    [onSelect]
  );

  useEffect(() => {
    const primeTimeItem = times.find((t) => t[2] === "primetime");
    if (
      primeTimeItem &&
      value >= primeTimeItem[0].getTime() &&
      value < addHours(primeTimeItem[0], 4)
    ) {
      setActiveIndex(times.indexOf(primeTimeItem));
    } else {
      const index = times.findIndex(
        (t) => value > startOfDay(t[0]) && value < endOfDay(t[0])
      );
      setActiveIndex(index);
    }
  }, [times, value]);

  return (
    <div ref={handleRef} className="days-bar">
      {times.map((item, index) => {
        const date = item[0];
        const label = item[1] ? item[1] : format(date, "dd/MM");
        const isActive = index === activeIndex;
        return (
          <button
            key={item}
            className="day-button"
            style={{ color: isActive ? "#000" : "#999" }}
            onClick={() => handleItemClick(date)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default DaysBar;
