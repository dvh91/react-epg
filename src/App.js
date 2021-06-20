import "./styles.css";
import { channels, DAYS_BACK_MILLIS } from "./data";
import { addDays, format, setMinutes, subDays } from "date-fns";
import {
  forwardRef,
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

export const LIST_WIDTH = 600;
export const LIST_HEIGHT = channelHeight * 4;
export const HOURS_IN_SCREEN = 3;
export const HOUR_WIDTH = LIST_WIDTH / HOURS_IN_SCREEN;
export const EPG_START_DATA_TIME = nowMillis - 10 * day;
export const EPG_END_DATA_TIME = nowMillis + 10 * day;

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

const Program = forwardRef(
  ({ data, isFocused, channelIndex, onUnmount }, ref) => {
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
        getWidthByTime(program.start - (Date.now() - DAYS_BACK_MILLIS)) +
        channelwidth;

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
  }
);

const Epg = forwardRef(
  ({ data, initialFocusedChannel, initialFocusedProgram }, ref) => {
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
      offsetTime.current = time;
      let left = getWidthByTime(time - (Date.now() - DAYS_BACK_MILLIS));
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
      const programLeft = getWidthByTime(
        program.start - (Date.now() - DAYS_BACK_MILLIS)
      );
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
      const left = getWidthByTime(time - (Date.now() - DAYS_BACK_MILLIS));
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

    const handleKeyUp = useCallback(
      (e) => {
        if (e.which !== 38 && e.which !== 40) return;

        e.preventDefault();

        setFocusedChannelIndex((prev) => {
          const next = e.which === 40 ? prev + 1 : prev - 1;
          containerRef.current.scrollTo({
            top: next * channelHeight,
            behavior: "smooth"
          });

          const nextProgram = data[next].programs.find(
            (program) =>
              offsetTime.current >= program.start &&
              offsetTime.current < program.end
          );

          setFocusedProgram(nextProgram);

          return next;
        });
      },
      [data]
    );

    const handleKeyDown = useCallback((e) => {
      if (e.which === 38 || e.which === 40) {
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
          <img src={focusedProgram?.image} className="details-image" />
          <div>
            <div style={{ marginBottom: 8 }}>{focusedProgram?.title}</div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>
              {focusedProgram?.description}
            </div>
          </div>
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
                left: getWidthByTime(Date.now() - epgEdges.start),
                bottom: 0,
                width: 4,
                zIndex: 10
              }}
            />
            <div className="times">
              {times.filter(isTimeVisible).map((time) => (
                <div
                  style={{
                    position: "absolute",
                    left: getWidthByTime(time - epgEdges.start),
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
              {data.map((channel, channelIndex) => (
                <div
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
                .filter((program) =>
                  isProgramVisible({ program, channelIndex })
                )
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
  }
);

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
          width: 600,
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
                // const channel = channels[0];
                // const program = channel.programs.find((p) =>
                //   isInTimerange(time, p.start, p.end)
                // );
                // epgRef.current?.scrollToTime(time);
                // epgRef.current?.focusProgram(program, channel);

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
        data={channels}
        initialFocusedChannel={channels[0]}
        initialFocusedProgram={channels[0].programs[10]}
      />
    </div>
  );
}
