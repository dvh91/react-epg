import { channelwidth, epgEdges, getWidthByTime } from "./utils";

const LiveIndicator = () => {
  return (
    <div
      className="live-indicator"
      style={{
        left: getWidthByTime(Date.now() - epgEdges.start) + channelwidth
      }}
    />
  );
};

export default LiveIndicator;
