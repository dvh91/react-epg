import "./styles.css";
import { channels } from "./data";
import keycode from "keycode";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
import LiveIndicator from "./LiveIndicator";
import ChannelList from "./ChannelList";
import TimesBar from "./TimesBar";

const useEpg = ({ data, initialFocusedChannel, initialFocusedProgram }) => {
  const offsetTime = useRef(Date.now());
  const containerRef = useRef();
  const unmountedFocusedProgramId = useRef(null);
  const programRefs = useRef({});

  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [focusedChannelIndex, setFocusedChannelIndex] = useState(() =>
    data.findIndex((c) => initialFocusedChannel?.number === c.number)
  );
  const [focusedProgram, setFocusedProgram] = useState(initialFocusedProgram);

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

  const isProgramVisible = useCallback(
    ({ program, channelIndex }) => {
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
    },
    [offsetX, offsetY]
  );

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

  const handleRightLeftPress = useCallback(
    (e) => {
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
    },
    [data, focusedChannelIndex, focusedProgram, scrollToTime]
  );

  const handleUpDownPress = useCallback(
    (e) => {
      e.preventDefault();

      setFocusedChannelIndex((prev) => {
        const next = e.which === keycode.codes["down"] ? prev + 1 : prev - 1;
        if (next < 0 || next > data.length - 1) return prev;

        const nextProgram = data[next].programs.find((program) =>
          isInTimerange(offsetTime.current, program.start, program.end)
        );

        setFocusedProgram(nextProgram);

        return next;
      });
    },
    [data]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (
        e.which === keycode.codes["left"] ||
        e.which === keycode.codes["right"]
      ) {
        return handleRightLeftPress(e);
      } else if (
        e.which === keycode.codes["up"] ||
        e.which === keycode.codes["down"]
      ) {
        return handleUpDownPress(e);
      }
    },
    [handleRightLeftPress, handleUpDownPress]
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

  const visiblePrograms = useMemo(
    () =>
      data.reduce((acc, channel, channelIndex) => {
        const channelVisiblePrograms = channel.programs.filter((program) =>
          isProgramVisible({ program, channelIndex })
        );
        acc.push(
          ...channelVisiblePrograms.map((program) => [program, channelIndex])
        );

        return acc;
      }, []),
    [data, isProgramVisible]
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

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyUp, handleKeyDown]);

  return {
    visiblePrograms,
    focusedProgram,
    offsetX,
    scrollToTime,
    scrollToTimeAndFocus,
    setFocusedChannelIndex,
    setFocusedProgram,
    handleProgramRef,
    handleProgramUnmount,
    containerRef
  };
};

const Epg = forwardRef((props, ref) => {
  const {
    data,
    initialFocusedChannel,
    initialFocusedProgram,
    onFocusedProgramChange
  } = props;

  const {
    visiblePrograms,
    focusedProgram,
    offsetX,
    scrollToTime,
    scrollToTimeAndFocus,
    setFocusedChannelIndex,
    setFocusedProgram,
    handleProgramRef,
    handleProgramUnmount,
    containerRef
  } = useEpg({
    channels,
    data,
    initialFocusedChannel,
    initialFocusedProgram
  });

  useEffect(() => {
    onFocusedProgramChange(focusedProgram);
  }, [focusedProgram, onFocusedProgramChange]);

  useImperativeHandle(ref, () => ({
    scrollToTime,
    scrollToTimeAndFocus,
    focusProgram: (program, channel) => {
      setFocusedChannelIndex(channels.indexOf(channel));
      setFocusedProgram(program);
    }
  }));

  return (
    <div className="epg">
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
          {visiblePrograms.map(([program, channelIndex]) => (
            <Program
              key={program.id}
              ref={handleProgramRef}
              data={program}
              channelIndex={channelIndex}
              isFocused={focusedProgram?.id === program.id}
              onUnmount={handleProgramUnmount}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

Epg.displayName = "Epg";

export default Epg;
