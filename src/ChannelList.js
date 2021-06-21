import { memo } from "react";
import { channelHeight } from "./utils";

const ChannelList = memo(({ channels }) => {
  return (
    <div className="channels">
      {channels.map((channel, channelIndex) => (
        <div
          key={channel.number}
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
  );
});

export default ChannelList;
