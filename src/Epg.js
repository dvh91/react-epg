import { forwardRef, useImperativeHandle } from "react";
import { channelHeight, epgEdges, getWidthByTime } from "./utils";
import Program from "./Program";
import LiveIndicator from "./LiveIndicator";
import ChannelList from "./ChannelList";
import TimesBar from "./TimesBar";
import useEpg from "./use-epg";

const Epg = forwardRef((props, ref) => {
  const {
    data,
    initialFocusedChannel,
    initialFocusedProgram,
    onFocusedProgramChange,
    onChannelIndexChange,
    onTimeChange
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
    data,
    initialFocusedChannel,
    initialFocusedProgram,
    onFocusedProgramChange,
    onChannelIndexChange,
    onTimeChange
  });

  useImperativeHandle(ref, () => ({
    scrollToTimeAndFocus
  }));

  return (
    <div className="epg">
      <div
        ref={containerRef}
        className="epg-container"
        style={{
          height: channelHeight * 4 + 36
        }}
      >
        <div
          style={{
            position: "relative",
            width: getWidthByTime(epgEdges.end - epgEdges.start),
            height: data.length * channelHeight
          }}
        >
          <LiveIndicator />
          <TimesBar offsetX={offsetX} />
          <ChannelList channels={data} />
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
