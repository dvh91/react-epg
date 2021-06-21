import { addDays, format } from "date-fns";
import { useCallback, useState } from "react";

const DaysBar = ({ onSelect }) => {
  const [times] = useState(() => {
    const result = [];
    for (let index = -10; index < 10; index++) {
      if (index === 0) result.push(["Now", new Date()]);
      else result.push(addDays(new Date(), index));
    }
    return result;
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
      {times.map((item) => {
        const date = Array.isArray(item) ? item[1] : item;
        const label = Array.isArray(item) ? item[0] : format(date, "dd/MM");
        return (
          <button
            key={item}
            className="day-button"
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
