// Box sets. `films` must match titles in movies.js exactly.
// Uzbek cinema is built automatically from the `uz` flag in movies.js.
export const collections = [
  // Themes: your picks
  {
    slug: 'mentors',
    kind: 'theme',
    title: 'Mentors',
    line: 'Teachers, coaches, and the people who see something in you first.',
    films: ['Dead Poets Society', 'Good Will Hunting', 'Scent of a Woman', 'Whiplash', 'Detachment', 'Patch Adams'],
  },
  {
    slug: 'founders-and-ambition',
    kind: 'theme',
    title: 'Founders and ambition',
    line: 'What it takes to build something, and what it can cost.',
    films: ['The Social Network', 'The Founder', 'The Wolf of Wall Street', 'The Aviator', 'Ford v Ferrari', 'The Pursuit of Happyness'],
  },
  {
    slug: 'brilliant-minds',
    kind: 'theme',
    title: 'Brilliant minds',
    line: 'Genius, and the weight that comes with it.',
    films: ['A Beautiful Mind', 'The Imitation Game', 'The Theory of Everything', 'Good Will Hunting'],
  },
  {
    slug: 'uzbek-cinema',
    kind: 'theme',
    title: 'Uzbek cinema',
    line: 'Films from home.',
    auto: 'uz',
  },

  // Franchises
  { slug: 'rocky-and-creed', kind: 'franchise', title: 'Rocky and Creed', line: 'It ain\'t about how hard you hit.',
    films: ['Rocky', 'Rocky II', 'Rocky III', 'Rocky IV', 'Rocky V', 'Rocky Balboa', 'Creed', 'Creed II', 'Creed III'] },
  { slug: 'the-godfather', kind: 'franchise', title: 'The Godfather trilogy', line: 'The Corleone family saga.',
    films: ['The Godfather', 'The Godfather Part II', 'The Godfather Part III'] },
  { slug: 'the-dark-knight', kind: 'franchise', title: 'The Dark Knight trilogy', line: "Nolan's Batman.",
    films: ['Batman Begins', 'The Dark Knight', 'The Dark Knight Rises'] },
  { slug: 'before-trilogy', kind: 'franchise', title: 'The Before trilogy', line: 'One conversation, eighteen years.',
    films: ['Before Sunrise', 'Before Sunset', 'Before Midnight'] },
  { slug: 'rambo', kind: 'franchise', title: 'Rambo', line: 'First blood and everything after.',
    films: ['First Blood', 'Rambo: First Blood Part II', 'Rambo III', 'John Rambo', 'Rambo: Last Blood'] },
  { slug: 'kill-bill', kind: 'franchise', title: 'Kill Bill', line: 'Two volumes, one revenge.',
    films: ['Kill Bill: Vol. 1', 'Kill Bill: Vol. 2'] },
  { slug: 'marvel', kind: 'franchise', title: 'Marvel Cinematic Universe', line: 'The big marathon.',
    films: [
      'Iron Man', 'Iron Man 2', 'Thor', 'Captain America: The First Avenger', 'The Avengers', 'Iron Man 3',
      'Thor: The Dark World', 'Guardians of the Galaxy', 'Avengers: Age of Ultron', 'Captain America: Civil War',
      'Doctor Strange', 'Guardians of the Galaxy Vol. 2', 'Spider-Man: Homecoming', 'Thor: Ragnarok',
      'Ant-Man and the Wasp', 'Avengers: Infinity War', 'Avengers: Endgame', 'Spider-Man: No Way Home',
      'Loki (Seasons 1–2)', 'Doctor Strange in the Multiverse of Madness', 'Thor: Love and Thunder',
      'Black Panther: Wakanda Forever', 'Ant-Man and the Wasp: Quantumania', 'Guardians of the Galaxy Vol. 3',
      'Deadpool & Wolverine', 'Captain America: Brave New World', 'The Fantastic Four: First Steps',
      'Spider-Man: Brand New Day',
    ] },
  { slug: 'spider-man', kind: 'franchise', title: 'Spider-Man', line: 'Every version of the friendly neighbor.',
    films: [
      'The Amazing Spider-Man', 'The Amazing Spider-Man 2', 'Spider-Man: Homecoming', 'Spider-Man: No Way Home',
      'Spider-Man: Across the Spider-Verse', 'Spider-Man: Brand New Day', 'Spider-Noir',
    ] },
  { slug: 'x-men-and-wolverine', kind: 'franchise', title: 'X-Men and Wolverine', line: 'Mutants, claws, and one very long goodbye.',
    films: [
      'X-Men Origins: Wolverine', 'X-Men: Days of Future Past', 'The Wolverine', 'X-Men: Apocalypse',
      'Logan', 'Deadpool', 'Deadpool 2', 'Deadpool & Wolverine',
    ] },
  { slug: 'harry-potter', kind: 'franchise', title: 'Harry Potter', line: 'All eight films, twice.',
    films: ['Harry Potter (all films)'] },
];
