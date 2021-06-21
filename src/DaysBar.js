import { addDays, format } from "date-fns";
import { useState } from "react";
import { LIST_WIDTH } from "./utils";

const DaysBar = ({ onSelect }) => {
  const [times] = useState(() => {
    const array = [];
    for (let index = -10; index < 10; index++) {
      if (index === 0) array.push(["Now", new Date()]);
      else array.push(addDays(new Date(), index));
    }
    return array;
  });

  return (
    <div
      ref={(ref) => {
        if (!ref) return;
        ref.scrollLeft = ref.offsetWidth / 2;
      }}
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
