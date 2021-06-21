import { channels } from "./data";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import Program from "./Program";
import { channelHeight, epgEdges, getWidthByTime } from "./utils";
import LiveIndicator from "./LiveIndicator";
import ChannelList from "./ChannelList";
import TimesBar from "./TimesBar";
import useEpg from "./use-epg";

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
    scrollToTimeAndFocus,
    handleProgramRef,
    handleProgramUnmount,
    containerRef
  } = useEpg({
    channels,
    data,
    initialFocusedChannel,
    initialFocusedProgram,
    onFocusedProgramChange
  });

  useImperativeHandle(ref, () => ({
    scrollToTimeAndFocus
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
