import "./styles.css";
import { generateTVGuide } from "./data";
import { useCallback, useEffect, useRef, useState } from "react";
import { LIST_WIDTH, isLive, day } from "./utils";
import Details from "./Details";
import Epg from "./Epg";
import DaysBar from "./DaysBar";
import { setMinutes } from "date-fns";

export default function App() {
  const epgRef = useRef();
  const [channels, setChannels] = useState(() => {
    const nowMillis = setMinutes(new Date(), 0).getTime();
    const start = nowMillis - 10 * day;
    const end = nowMillis + 10 * day;
    return generateTVGuide({ start, end });
  });
  const [focusedChannelIndex, setFocusedChannelIndex] = useState();
  const [focusedProgram, setFocusedProgram] = useState();
  const [time, setTime] = useState();

  const handleDaySelect = useCallback((time) => {
    if (!epgRef.current) return;
    epgRef.current.scrollToTimeAndFocus(time);
  }, []);

  const handleChannelIndexChange = useCallback((index) => {
    setFocusedChannelIndex(index);
  }, []);

  useEffect(() => {
    if (!time || focusedChannelIndex === undefined) return;

    // fetch data based on time and focused channel index
  }, [time, focusedChannelIndex]);

  return (
    <div className="App" style={{ width: LIST_WIDTH }}>
      <DaysBar value={time} onSelect={handleDaySelect} />
      <Details focusedProgram={focusedProgram} />
      <Epg
        ref={epgRef}
        channels={channels}
        data={channels}
        initialFocusedChannel={channels[0]}
        initialFocusedProgram={channels[0].programs.find((p) =>
          isLive(p.start, p.end)
        )}
        onFocusedProgramChange={setFocusedProgram}
        onChannelIndexChange={handleChannelIndexChange}
        onTimeChange={setTime}
      />
    </div>
  );
}
