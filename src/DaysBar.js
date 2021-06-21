import { addDays, format, getHours, setHours } from "date-fns";
import { useCallback, useState } from "react";

const primeTimeHour = 20;

const DaysBar = ({ value, onSelect }) => {
  const [times] = useState(() => {
    const result = [];
    for (let index = -10; index < 10; index++) {
      if (index === 0) result.push([new Date(), "Now"]);
      else result.push([addDays(new Date(), index)]);
    }

    if (getHours(new Date()) + 3 < primeTimeHour + 2) {
      result.push([setHours(new Date(), primeTimeHour), "This evening"]);
    }

    return result.sort(([dateA], [dateB]) => dateA - dateB);
  });

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

  return (
    <div ref={handleRef} className="days-bar">
      {times.map((item, index) => {
        const date = item[0];
        const label = item.length === 2 ? item[1] : format(date, "dd/MM");
        const isActive =
          value > date.getTime() && value < times[index + 1][0].getTime();
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
