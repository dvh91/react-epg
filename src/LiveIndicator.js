import { channelwidth, epgEdges, getWidthByTime } from "./utils";

const LiveIndicator = () => {
  return (
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
  );
};

export default LiveIndicator;
