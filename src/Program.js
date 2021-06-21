import { format } from "date-fns";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import {
  channelHeight,
  channelwidth,
  epgEdges,
  getChannelTopOffset,
  getProgramWidth,
  getWidthByTime
} from "./utils";

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

export default Program;
