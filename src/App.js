import "./styles.css";
import { channels } from "./data";
import { useCallback, useRef, useState } from "react";
import { LIST_WIDTH, isLive } from "./utils";
import Details from "./Details";
import Epg from "./Epg";
import DaysBar from "./DaysBar";

export default function App() {
  const epgRef = useRef();
  const [focusedProgram, setFocusedProgram] = useState();

  const handleDaySelect = useCallback((time) => {
    if (!epgRef.current) return;
    epgRef.current.scrollToTimeAndFocus(time);
  }, []);

  return (
    <div className="App" style={{ width: LIST_WIDTH }}>
      <DaysBar onSelect={handleDaySelect} />
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
      />
    </div>
  );
}
