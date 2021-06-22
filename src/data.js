const availableEvents = [
  {
    title: "Avengers",
    image:
      "https://fanart.tv/fanart/movies/99861/moviethumb/avengers-age-of-ultron-55ff4a081b4f4.jpg",
    description:
      "After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe."
  },
  {
    title: "How I Met Your Mother",
    image:
      "https://fanart.tv/fanart/tv/75760/tvthumb/how-i-met-your-mother-5c05179b4f6c0.jpg",
    description:
      "A father recounts to his children - through a series of flashbacks - the journey he and his four best friends took leading up to him meeting their mother."
  },
  {
    title: "Silicon Valley",
    image:
      "https://fanart.tv/fanart/tv/277165/tvthumb/silicon-valley-559d97ec079f3.jpg",
    description:
      "Follows the struggle of Richard Hendricks, a Silicon Valley engineer trying to build his own company called Pied Piper."
  },
  {
    title: "Late Night with Jimmy Fallon",
    image:
      "https://fanart.tv/fanart/tv/85355/tvthumb/late-night-with-jimmy-fallon-50b16e376c3f4.jpg",
    description: "Comedian Jimmy Fallon hosts a late-night talk show."
  },
  {
    title: "The Big Bang Theory",
    image:
      "https://fanart.tv/fanart/tv/80379/tvthumb/the-big-bang-theory-4f00d72c1c50b.jpg",
    description:
      "A woman who moves into an apartment across the hall from two brilliant but socially awkward physicists shows them how little they know about life outside of the laboratory."
  },
  {
    title: "Leon",
    image:
      "https://fanart.tv/fanart/movies/101/moviethumb/leon-the-professional-535fdab0b01c8.jpg",
    description:
      "Mathilda, a 12-year-old girl, is reluctantly taken in by Léon, a professional assassin, after her family is murdered. An unusual relationship forms as she becomes his protégée and learns the assassin's trade."
  }
];

const availableChannelLogos = [
  "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/CNN_88.png",
  "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/MB1_88.png",
  "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/NGO_88.png",
  "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/FXH_60.png",
  "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/TRM_88.png"
];

const availableEventLength = [
  1000 * 60 * 15,
  1000 * 60 * 30,
  1000 * 60 * 45,
  1000 * 60 * 60,
  1000 * 60 * 120,
  1000 * 60 * 270
];

const getEventEnd = (eventStartMillis) => {
  const length =
    availableEventLength[
      Math.floor(Math.random() * availableEventLength.length + 0)
    ];
  return eventStartMillis + length;
};

const createEvents = (epgChannel, startTime, endTime) => {
  const events = new Array();

  let currentTime = startTime;

  while (currentTime <= endTime) {
    const eventEnd = getEventEnd(currentTime);
    const event = availableEvents[Math.floor(Math.random() * 6 + 0)];
    const epgEvent = {
      id: currentTime + epgChannel.number,
      start: currentTime,
      end: eventEnd - 1,
      title: event.title,
      image: event.image,
      description: event.description
    };
    events.push(epgEvent);
    currentTime = eventEnd;
  }

  return events;
};

export const generateTVGuide = ({ start, end }) => {
  const channels = [];

  for (let i = 0; i < 100; i++) {
    const epgChannel = {
      number: i + 1,
      logo: availableChannelLogos[i % 5]
    };

    epgChannel.programs = createEvents(epgChannel, start, end);
    channels.push(epgChannel);
  }

  return channels;
};
