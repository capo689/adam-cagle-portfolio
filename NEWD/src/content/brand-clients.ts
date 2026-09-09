export type ClientLogo = {
  name: string;
  src: string;
  treatment?: "xbox" | "coastal" | "residence" | "detail";
};

export const clientLogos: ClientLogo[] = [
  { name: "AMD", src: "/brand/client-logos/amd.png" },
  { name: "Microsoft", src: "/brand/client-logos/microsoft.png" },
  { name: "Xbox", src: "/brand/client-logos/xbox-mono-detail.png", treatment: "xbox" },
  { name: "Blizzard Entertainment", src: "/brand/client-logos/blizzard.png" },
  { name: "ViewSonic", src: "/brand/client-logos/viewsonic.png" },
  { name: "Killer Networks", src: "/brand/client-logos/killer-network.png" },
  { name: "Traveler Guitar", src: "/brand/client-logos/traveler-guitar.png" },
  { name: "Hotel Figueroa", src: "/brand/client-logos/hotel-figueroa.png" },
  { name: "Sunset Marquis", src: "/brand/client-logos/sunset-marquis.png" },
  { name: "Clink Hostels", src: "/brand/client-logos/clink-hostels-white.png" },
  { name: "Playa Hotels & Resorts", src: "/brand/client-logos/playa.png" },
  { name: "Hotel SAX Chicago", src: "/brand/client-logos/hotel-sax.png" },
  { name: "NAVIS", src: "/brand/client-logos/navis.png" },
  { name: "Oxford Collection", src: "/brand/client-logos/oxford-collection.png" },
  { name: "Raleigh Studios", src: "/brand/client-logos/raleigh-studios.png" },
  { name: "Coastal Corridor Alliance", src: "/brand/client-logos/coastal-corridor-alliance-mono-detail.png", treatment: "coastal" },
  { name: "Marina Harbor", src: "/brand/client-logos/marina-harbor.png", treatment: "detail" },
  { name: "The Sky Lodge", src: "/brand/client-logos/sky-lodge.png" },
  { name: "Orbital Virtual Studios", src: "/brand/client-logos/orbital.png" },
  { name: "IMA Members Lounge", src: "/brand/client-logos/ima.png" },
  { name: "Bigfoot Networks", src: "/brand/client-logos/bigfoot-mono-detail.png", treatment: "detail" },
  { name: "National 9 Inn", src: "/brand/client-logos/national-9-inn-mono-detail.png", treatment: "detail" },
  { name: "Cavatina", src: "/brand/client-logos/cavatina.png" },
  { name: "MBS Chicago", src: "/brand/client-logos/mbs-chicago-mono-detail.png", treatment: "detail" },
  { name: "Rubicon Entertainment", src: "/brand/client-logos/rubicon.png" },
  { name: "SLAP", src: "/brand/client-logos/slap.png" },
  { name: "Sosea 1533", src: "/brand/client-logos/sosea-1533.png" },
  { name: "Down & Dirty in Gower Gulch", src: "/brand/client-logos/down-and-dirty-mono-detail.png", treatment: "detail" },
  { name: "Magellan", src: "/brand/client-logos/magellan.png" },
  { name: "Bimini Bull Run", src: "/brand/client-logos/bimini-bull-run-mono-detail.png", treatment: "detail" },
  { name: "The Yard", src: "/brand/client-logos/the-yard.png" },
  { name: "Zeal", src: "/brand/client-logos/zeal.png" },
  { name: "Red Touch Media", src: "/brand/client-logos/red-touch-media.png" },
  { name: "Rosenthal", src: "/brand/client-logos/rosenthal.png" },
  { name: "The Residence Club at PGA West", src: "/brand/client-logos/residence-club-mono-detail.png", treatment: "residence" },
  { name: "6Second Media", src: "/brand/client-logos/six-second-media.png" },
];
