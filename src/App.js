import "./styles.css";
import { channels } from "./data";
import { addDays, format, subDays } from "date-fns";
import keycode from "keycode";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { throttle } from "lodash";
import Program from "./Program";
import {
  LIST_WIDTH,
  hour,
  channelHeight,
  channelwidth,
  epgEdges,
  getWidthByTime,
  isInTimerange
} from "./utils";
import Details from "./Details";
import LiveIndicator from "./LiveIndicator";
import ChannelList from "./ChannelList";
import TimesBar from "./TimesBar";

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

  return (
    <div className="epg" style={{ width: LIST_WIDTH }}>
      <Details focusedProgram={focusedProgram} />
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
          <LiveIndicator />
          <TimesBar offsetX={offsetX} />
          <ChannelList channels={channels} />
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
              key={item}
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
