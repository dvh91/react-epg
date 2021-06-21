import { setMinutes } from "date-fns";

export const minute = 60 * 1000;
export const hour = 60 * minute;
export const day = 24 * hour;
export const channelHeight = 100;
export const channelwidth = 80;
const nowMillis = setMinutes(new Date(), 0).getTime();

export const LIST_WIDTH = 720;
export const LIST_HEIGHT = channelHeight * 4;
export const HOURS_IN_SCREEN = 3;
export const HOUR_WIDTH = LIST_WIDTH / HOURS_IN_SCREEN;
export const EPG_START_DATA_TIME = nowMillis - 15 * day;
export const EPG_END_DATA_TIME = nowMillis + 15 * day;

export const epgEdges = {
  start: EPG_START_DATA_TIME,
  end: EPG_END_DATA_TIME
};

export const getWidthByTime = (time) => {
  return HOUR_WIDTH * (time / hour);
};

export const getProgramWidth = (start, end) => {
  return getWidthByTime(end - start);
};

export const isInTimerange = (time, start, end) => {
  return time >= start && time < end;
};

export const isLive = (start, end) => {
  const now = Date.now();
  return isInTimerange(now, start, end);
};

export const getChannelTopOffset = (channelIndex) =>
  channelIndex * channelHeight + 36;
