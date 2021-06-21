import { format } from "date-fns";
import { useCallback, useState } from "react";
import {
  channelwidth,
  epgEdges,
  getWidthByTime,
  hour,
  LIST_WIDTH
} from "./utils";

const TimesBar = ({ offsetX }) => {
  const [times, setTimes] = useState(() => {
    let time = epgEdges.start;
    const result = [time];

    while (time < epgEdges.end) {
      time += hour;
      result.push(time);
    }

    return result;
  });

  const isTimeVisible = useCallback(
    (time) => {
      const left = getWidthByTime(time - epgEdges.start) + channelwidth;
      const width = hour;
      const right = left + width;

      if (left > offsetX - width && right - width < offsetX + LIST_WIDTH)
        return true;

      return false;
    },
    [offsetX]
  );

  return (
    <div className="times">
      {times.filter(isTimeVisible).map((time) => (
        <div
          key={time}
          style={{
            position: "absolute",
            left: getWidthByTime(time - epgEdges.start) + channelwidth,
            zIndex: 10,
            display: "flex",
            alignItems: "center"
          }}
        >
          {format(time, "HH:mm")}
        </div>
      ))}
    </div>
  );
};

export default TimesBar;
