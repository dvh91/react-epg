import { addDays, format, subDays } from "date-fns";
import { useState } from "react";
import { LIST_WIDTH } from "./utils";

const DaysBar = ({ onSelect }) => {
  const [times, setTimes] = useState([
    subDays(new Date(), 10),
    subDays(new Date(), 9),
    subDays(new Date(), 8),
    subDays(new Date(), 7),
    subDays(new Date(), 6),
    subDays(new Date(), 5),
    subDays(new Date(), 4),
    subDays(new Date(), 3),
    subDays(new Date(), 2),
    subDays(new Date(), 1),
    ["Now", new Date()],
    addDays(new Date(), 1),
    addDays(new Date(), 2),
    addDays(new Date(), 3),
    addDays(new Date(), 4),
    addDays(new Date(), 5),
    addDays(new Date(), 6),
    addDays(new Date(), 7),
    addDays(new Date(), 8),
    addDays(new Date(), 9),
    addDays(new Date(), 10)
  ]);

  return (
    <div
      ref={(ref) => (ref.scrollLeft = ref.offsetWidth / 2)}
      style={{
        width: LIST_WIDTH,
        whiteSpace: "nowrap",
        overflow: "scroll",
        padding: 8,
        backgroundColor: "#f8f8f8"
      }}
    >
      {times.map((item) => {
        const date = Array.isArray(item) ? item[1] : item;
        const label = Array.isArray(item) ? item[0] : format(date, "dd/MM");
        return (
          <button
            key={item}
            className="day-button"
            onClick={() => {
              const time = date.getTime();
              onSelect(time);
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default DaysBar;
