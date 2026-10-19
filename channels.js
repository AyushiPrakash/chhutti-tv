// The TV's channels, in order. Everything is in Hindi, like Indian cable TV.
// LOCKED: keep these episodes fixed so the owner can review them once. Only change a channel when the owner asks for that channel.
// Channel 1 is the first entry.
// To add a show: paste its YouTube video id (the part after watch?v=) and a title.
// Optional alt: [ids] are backup episodes, tried in turn if YouTube refuses to play the main one.
// Optional end: seconds where the main video stops being the show; the channel loops back to the start there.
// The video's owner must allow embedding, or the channel will only show static.
// A null entry is a channel with nothing on it: it shows a blue NO SIGNAL screen.
// Any channel number past the end of the list has no signal too.
var CHANNELS = [
  { id: 'w5PQo86APeo', title: 'Pokémon: Indigo League, Ep. 1 "I Choose You!"' },
  { id: 'pEl3-0GHyoQ', title: 'Tom & Jerry, old episodes', alt: ['_KkFiiAYDFQ'] },
  { id: 'Hcrb__TFoBA', title: 'Shinchan, old episode (Hindi)', alt: ['JFL41rTf1L8'] },
  { id: 'pOHDWCt8z40', title: 'The Jungle Book, Ep. 1: Mowgli Comes to the Jungle (Hindi)' },
  { id: '3ybTTlJHlQQ', title: 'Takeshi\'s Castle (Hindi, Javed Jaffrey)' },
  { id: 'Jee3oEBuVRU', title: 'Perman (Hindi)' },
  { id: 'ternHb3hnMw', title: 'Ninja Hattori (Hindi)' },
  { id: 'ocW3sUB2hW8', title: 'Kiteretsu (Hindi)', end: 805, alt: ['AIy2K70NcpM'] },
  { id: 'ukT7PpM_Eyw', title: 'Dragon Ball Z: Wrath of the Dragon (1995 movie, Hindi)' },
  { id: 'Sl-979s7uIg', title: 'Scooby-Doo, Where Are You!, Ep. 2: A Clue for Scooby-Doo, Part 1 (Hindi)', alt: ['C-upU-cb8CY', 'XXdpDavYXKY'] },
  { id: 'nSdz5ln2rME', title: 'Popeye the Sailor Man, classic collection' },
  { id: 'O9Nw51J1r8E', title: 'The Powerpuff Girls: Moral Decay / Meet the Beat Alls', alt: ['oh7aPzlMnPQ'] },
  { id: 'ugBHrOUM2cY', title: 'Johnny Bravo: It\'s Valentine\'s Day (2003, Hindi)' },
  { id: 'Pi8MhFOZlYA', title: 'Ben 10 and Uncle Grandpa, Part 3' },
  { id: 'PkwYiweKX_8', title: 'Oswald: Big Banana Day (Hindi)' },
  { id: 'rEouwkaelik', title: 'Bob the Builder, Ep. 1 (Hindi)' },
  { id: 's71tRK0SiHU', title: 'Teletubbies, Ep. 1 (Hindi)' },
  { id: 'sARWllPR618', title: 'Spider-Man: The Animated Series (1994), S1 Ep. 1 (Hindi)' },
  { id: 'lptID7HYfrk', title: 'Doraemon, classic episode (Hindi)' },
  { id: 'sRT2Q92jU1Q', title: 'Kid vs Kat (Hindi)' },
  { id: 'bEkEipkTMaI', title: 'MAD, Ep. 1 (Hindi)' },
  null,
  { id: 'cz40hvkpoag', title: 'Little Krishna (Hindi)' },
  { id: 'H0QVCkNBxTU', title: 'Simba the King Lion, Ep. 36 (Hindi)' },
  { id: 'U4ft2VVZR90', title: 'He-Man (Hindi)' },
  { id: '2A3JpaHUG2c', title: 'Richie Rich, Ep. 1 (Hindi)' },
  { id: '12qd-Sg8BY0', title: 'Franklin, Ep. 43 (Hindi)' },
  { id: '6Udd9B8lsgU', title: 'Dragon Tales, Ep. 23 (Hindi)' },
  { id: 'YHv3R29-3qc', title: 'Pingu' },
  { id: 'bmLklzwS1Wk', title: 'Mr. Bean: The Animated Series, Season 2' },
  { id: '7PDwoRz0QNw', title: 'Courage the Cowardly Dog (Hindi)', alt: ['H40v3ISrHhQ'] },
  { id: '-b8tsRtlPB4', title: 'Make Way for Noddy, Ep. 5: Noddy\'s Perfect Gift (Hindi)' },
  { id: '8JuVMoGj6fE', title: 'Looney Tunes: Wile E. Coyote and Road Runner', alt: ['DuXwFlL8Usk'] },
  { id: 'Ef9s0Vfo9cs', title: 'Chip \'n\' Dale: Winter Storage' },
  { id: 'Fx_47s7MeJQ', title: 'Barbie in The 12 Dancing Princesses, Part 1 (Hindi)', alt: ['wxmeCrm1a6Q'] },
  { id: 'E__Qk3h18SY', title: 'The Pink Panther Show: Pink Panther and the Tuba' },
  { id: 'HX8gkJ4eDTI', title: 'Miffy and Friends: Miffy and the Birthday Cake' },
  { id: 'h98EvZNtie8', title: 'Strawberry Shortcake (2003): Meet Strawberry Shortcake' },
  { id: '2eWAoA3l7f4', title: 'The Flintstones: opening (1 min clip)' },
  { id: 'dOyoXIYdOz8', title: 'Haddi Mera Buddy (Billy and Mandy, Hindi)' },
  { id: 'xfACNGbp2gA', title: "Handy Manny, S2: Home Sweet Home / Jackie's Old Shed (Hindi)" },
  { id: 'FoZvrNIllcw', title: 'Phineas and Ferb, Ep. 1, Part 1 (Hindi)' },
  { id: '8V2UAip5Kww', title: 'Harry and His Bucket Full of Dinosaurs, Season 1' },
  { id: 'co5xrfrFXmE', title: 'Bas Karo Henry (Horrid Henry, Hindi)' },
  { id: 'i_ejECJUIBw', title: 'Baby Looney Tunes, Ep. 1, Part 1 (Hindi)' },
  { id: 'WTybBd9Ki_o', title: 'Backyard Science, S2 Ep. 36: How to Make an Erupting Volcano' },
  { id: '9nYnkHHmXPM', title: 'Power Rangers S.P.D., Ep. 15 (Hindi)' },
  { id: 'fLPS4sIpYh0', title: 'Shaun the Sheep, Season 4, Eps. 19 to 24' },
  { id: 'LJlCLDNkIxw', title: "Mickey Mouse: Mickey's Parrot (1938)" }
];
