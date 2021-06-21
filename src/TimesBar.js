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
  const [times] = useState(() => {
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
          className="times-item"
          style={{
            left: getWidthByTime(time - epgEdges.start) + channelwidth
          }}
        >
          {format(time, "HH:mm")}
        </div>
      ))}
    </div>
  );
};

export default TimesBar;
