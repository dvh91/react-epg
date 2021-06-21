import "./styles.css";
import { channels } from "./data";
import { addDays, format, isSameDay, setMinutes, subDays } from "date-fns";
import keycode from "keycode";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { throttle } from "lodash";

export const minute = 60 * 1000;
export const hour = 60 * minute;
export const day = 24 * hour;
const channelHeight = 100;
const channelwidth = 80;
const nowMillis = setMinutes(new Date(), 0).getTime();

export const LIST_WIDTH = 720;
export const LIST_HEIGHT = channelHeight * 4;
export const HOURS_IN_SCREEN = 3;
export const HOUR_WIDTH = LIST_WIDTH / HOURS_IN_SCREEN;
export const EPG_START_DATA_TIME = nowMillis - 15 * day;
export const EPG_END_DATA_TIME = nowMillis + 15 * day;

export const epgEdges = {
  start: EPG_START_DATA_TIME,
  end: EPG_END_DATA_TIME
};

export const getWidthByTime = (time) => {
  return HOUR_WIDTH * (time / hour);
};

export const getProgramWidth = (start, end) => {
  return getWidthByTime(end - start);
};

export const isInTimerange = (time, start, end) => {
  return time >= start && time < end;
};

export const isLive = (start, end) => {
  const now = Date.now();
  return isInTimerange(now, start, end);
};

const getChannelTopOffset = (channelIndex) => channelIndex * channelHeight + 36;

const Program = memo(
  forwardRef(({ data, isFocused, channelIndex, onUnmount }, ref) => {
    const rootRef = useRef(null);
    const [isFuture, setIsFuture] = useState(() => {
      const isLive = Date.now() >= data.start && Date.now() < data.end;
      return !isLive && Date.now() < data.end;
    });

    useImperativeHandle(ref, () => ({
      id: data.id,
      focus: () => {
        rootRef.current.focus();
      }
    }));

    useEffect(() => {
      return () => onUnmount(data.id);
    }, []);

    const getProgramStyle = ({ program, channelIndex }) => {
      const left =
        getWidthByTime(program.start - epgEdges.start) + channelwidth;

      const width = getProgramWidth(program.start, program.end);
      const height = channelHeight;

      return {
        position: "absolute",
        top: getChannelTopOffset(channelIndex),
        left,
        width,
        height,
        backgroundColor: isFocused ? "#ccc" : undefined,
        opacity: isFuture ? 0.5 : 1
      };
    };

    return (
      <div
        ref={rootRef}
        className="program"
        tabIndex="0"
        style={getProgramStyle({ program: data, channelIndex })}
      >
        <div className="program-title">{data.title}</div>
        <div className="program-times">
          {format(data.start, "HH:mm")} - {format(data.end, "HH:mm")}
        </div>
      </div>
    );
  })
);

Program.displayName = "Program";

const Epg = forwardRef((props, ref) => {
  const {
    channels,
    data,
    initialFocusedChannel,
    initialFocusedProgram
  } = props;
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const offsetTime = useRef(Date.now());
  const containerRef = useRef();
  const programRefs = useRef({});
  const [focusedChannelIndex, setFocusedChannelIndex] = useState(() =>
    data.findIndex((c) => initialFocusedChannel?.number === c.number)
  );
  const [focusedProgram, setFocusedProgram] = useState(initialFocusedProgram);

  const unmountedFocusedProgramId = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollToTime,
    scrollToTimeAndFocus,
    focusProgram: (program, channel) => {
      setFocusedChannelIndex(channels.indexOf(channel));
      setFocusedProgram(program);
    }
  }));

  const scrollToTime = useCallback((time, behavior = "smooth") => {
    offsetTime.current = time - 1;

    let left = getWidthByTime(time - epgEdges.start) + channelwidth / 2;
    left -= LIST_WIDTH / 2;

    containerRef.current.scrollTo({
      left,
      behavior
    });
  }, []);

  const scrollToTimeAndFocus = useCallback(
    (time) => {
      scrollToTime(time);
      const channel = data[focusedChannelIndex];
      const program = channel.programs.find((p) =>
        isInTimerange(time, p.start, p.end)
      );
      setFocusedProgram(program);
    },
    [data, focusedChannelIndex, scrollToTime]
  );

  const scrollToProgram = useCallback(
    (program, isSmoothScroll) => {
      const time = program.start + (program.end - program.start) / 2;

      scrollToTime(time, isSmoothScroll ? "smooth" : "auto");
    },
    [scrollToTime]
  );

  useEffect(() => {
    if (!initialFocusedProgram) return;
    scrollToProgram(initialFocusedProgram, false);
  }, [initialFocusedProgram, scrollToProgram]);

  useEffect(() => {
    if (!focusedProgram) return;
    if (!programRefs.current[focusedProgram.id]) {
      unmountedFocusedProgramId.current = focusedProgram.id;
      return;
    }
    programRefs.current[focusedProgram.id].focus();
  }, [focusedProgram]);

  const isProgramVisible = ({ program, channelIndex }) => {
    if (offsetY > channelIndex * channelHeight + 4 * channelHeight) {
      return false;
    }
    if (offsetY < channelIndex * channelHeight - 4 * channelHeight) {
      return false;
    }
    const programLeft =
      getWidthByTime(program.start - epgEdges.start) + channelwidth;
    const programWidth = getWidthByTime(program.end - program.start);
    const programRight = programLeft + programWidth;

    if (
      programLeft > offsetX - programWidth &&
      programRight - programWidth < offsetX + LIST_WIDTH
    )
      return true;

    return false;
  };

  const isTimeVisible = (time) => {
    const left = getWidthByTime(time - epgEdges.start) + channelwidth;
    const width = hour;
    const right = left + width;

    if (left > offsetX - width && right - width < offsetX + LIST_WIDTH)
      return true;

    return false;
  };

  const handleProgramRef = useCallback((ref) => {
    if (!ref) return;
    programRefs.current[ref.id] = ref;

    if (unmountedFocusedProgramId.current === ref.id) {
      ref.focus();
      unmountedFocusedProgramId.current = null;
    }
  }, []);

  const handleProgramUnmount = useCallback((programId) => {
    programRefs.current[programId] = null;
  }, []);

  useEffect(() => {
    containerRef.current.addEventListener(
      "scroll",
      throttle((e) => {
        setOffsetX(e.target.scrollLeft);
        setOffsetY(e.target.scrollTop);
      }, 100)
    );
  }, []);

  useEffect(() => {
    containerRef.current.scrollTo({
      top: focusedChannelIndex * channelHeight,
      behavior: "smooth"
    });
  }, [focusedChannelIndex]);

  const handleKeyDown = useCallback(
    (e) => {
      if (
        e.which === keycode.codes["left"] ||
        e.which === keycode.codes["right"]
      ) {
        e.preventDefault();
        const channel = data[focusedChannelIndex];
        const index = channel.programs.indexOf(focusedProgram);
        const next = e.which === keycode.codes["left"] ? index - 1 : index + 1;
        const nextProgram = channel.programs[next];
        if (nextProgram) {
          setFocusedProgram(nextProgram);
          scrollToTime(
            nextProgram.start + (nextProgram.end - nextProgram.start) / 2
          );
        } else {
          scrollToTime(
            e.which === keycode.codes["left"]
              ? offsetTime.current - hour
              : offsetTime.current + hour
          );
        }

        return;
      }

      if (e.which !== keycode.codes["up"] && e.which !== keycode.codes["down"])
        return;

      e.preventDefault();

      setFocusedChannelIndex((prev) => {
        const next = e.which === keycode.codes["down"] ? prev + 1 : prev - 1;
        if (next < 0 || next > data.length - 1) return prev;

        const nextProgram = data[next].programs.find(
          (program) =>
            offsetTime.current >= program.start &&
            offsetTime.current < program.end
        );

        setFocusedProgram(nextProgram);

        return next;
      });
    },
    [data, focusedProgram, focusedChannelIndex, scrollToTime]
  );

  const handleKeyUp = useCallback((e) => {
    if (
      e.which === keycode.codes["up"] ||
      e.which === keycode.codes["down"] ||
      e.which === keycode.codes["left"] ||
      e.which === keycode.codes["right"]
    ) {
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyUp, handleKeyDown]);

  const [times, setTimes] = useState(() => {
    let time = epgEdges.start;
    const result = [time];

    while (time < epgEdges.end) {
      time += hour;
      result.push(time);
    }

    return result;
  });

  return (
    <div className="epg" style={{ width: LIST_WIDTH }}>
      <div className="details">
        {focusedProgram && (
          <>
            <img src={focusedProgram?.image} className="details-image" />
            <div>
              <div style={{ marginBottom: 4 }}>{focusedProgram?.title}</div>
              <div style={{ marginBottom: 8, fontSize: 14 }}>
                {!isSameDay(new Date(), focusedProgram.start) && (
                  <>{format(focusedProgram.end, "EEEE, dd/MM")} at </>
                )}
                {format(focusedProgram.start, "HH:mm")} -
                {format(focusedProgram.end, "HH:mm")}
              </div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>
                {focusedProgram?.description}
              </div>
            </div>
          </>
        )}
      </div>
      <div
        ref={containerRef}
        style={{
          height: channelHeight * 4 + 36,
          overflow: "auto",
          position: "relative"
        }}
      >
        <div
          style={{
            position: "relative",
            width: getWidthByTime(epgEdges.end - epgEdges.start),
            height: channels.length * channelHeight
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.1)",
              position: "absolute",
              top: 0,
              left: getWidthByTime(Date.now() - epgEdges.start) + channelwidth,
              bottom: 0,
              width: 4,
              zIndex: 10
            }}
          />
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
          <div className="channels">
            {channels.map((channel, channelIndex) => (
              <div
                key={channel.number}
                style={{
                  height: channelHeight,
                  padding: 4,
                  display: "flex"
                }}
              >
                <img src={channel.logo} width={60} height={60} />
              </div>
            ))}
          </div>
          {data.map((channel, channelIndex) =>
            channel.programs
              .filter((program) => isProgramVisible({ program, channelIndex }))
              .map((program) => (
                <Program
                  key={program.id}
                  ref={handleProgramRef}
                  onUnmount={handleProgramUnmount}
                  data={program}
                  channelIndex={channelIndex}
                  isFocused={focusedProgram?.id === program.id}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
});

Epg.displayName = "Epg";

export default function App() {
  const epgRef = useRef();

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
    <div className="App">
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
              className="day-button"
              onClick={() => {
                const time = date.getTime();
                epgRef.current?.scrollToTimeAndFocus(time);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Epg
        ref={epgRef}
        channels={channels}
        data={channels}
        initialFocusedChannel={channels[0]}
        initialFocusedProgram={channels[0].programs[10]}
      />
    </div>
  );
}
