import { collection, config, fields, singleton } from '@keystatic/core';

// On your computer the admin edits files directly. On the live site it saves through
// GitHub (every save is a commit, and Vercel rebuilds the site).
// Set PUBLIC_KEYSTATIC_MODE=github in .env to use GitHub mode locally (needed once, for setup).
const useGitHub = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_MODE === 'github';

export default config({
  storage: useGitHub ? { kind: 'github', repo: 'SoleSergeant/ozodjonov' } : { kind: 'local' },

  ui: {
    brand: { name: 'Muhammadjon.' },
    navigation: {
      Writing: ['blog'],
      Movies: ['diary', 'collections', 'actors'],
      CV: ['cv'],
      Settings: ['site'],
    },
  },

  collections: {
    blog: collection({
      label: 'Blog posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', description: 'One sentence shown in previews.', multiline: true }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: (p) => p.value }),
        draft: fields.checkbox({ label: 'Draft', description: 'Drafts are hidden on the live site.', defaultValue: false }),
        content: fields.markdoc({ label: 'Content', extension: 'md' }),
      },
    }),

    diary: collection({
      label: 'Film diary (by year)',
      slugField: 'year',
      path: 'src/content/diary/*',
      format: { data: 'json' },
      schema: {
        year: fields.slug({
          name: { label: 'Year', description: 'The year you watched these, e.g. 2027.' },
        }),
        films: fields.array(
          fields.object({
            title: fields.text({ label: 'Title', validation: { isRequired: true } }),
            watched: fields.date({
              label: 'Date watched',
              description: 'Puts the film on the home page calendar. Filled in with today for new films.',
              defaultValue: { kind: 'today' },
            }),
            released: fields.integer({ label: 'Release year', description: 'Helps find the right poster.' }),
            rewatch: fields.checkbox({ label: 'Rewatch' }),
            uzbek: fields.checkbox({ label: 'Uzbek cinema' }),
            series: fields.checkbox({ label: 'Series' }),
            reflection: fields.relationship({
              label: 'Reflection',
              description: 'A blog post about this film. Adds a "Read reflection" link to its poster.',
              collection: 'blog',
            }),
            poster: fields.image({
              label: 'Poster (optional)',
              description: 'Upload your own poster. Leave empty to find one automatically.',
              directory: 'public/posters',
              publicPath: '/posters/',
            }),
            search: fields.text({
              label: 'Poster search (optional)',
              description: 'Only if the poster comes out wrong: the original title to search for instead.',
            }),
          }),
          {
            label: 'Films, in the order you watched them',
            itemLabel: (p) =>
              `${p.fields.title.value || 'New film'}${p.fields.rewatch.value ? ' · rewatch' : ''}`,
          },
        ),
      },
    }),

    collections: collection({
      label: 'Collections',
      slugField: 'title',
      path: 'src/content/collections/*',
      format: { data: 'json' },
      columns: ['title', 'order'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        kind: fields.select({
          label: 'Type',
          options: [
            { label: 'Theme', value: 'theme' },
            { label: 'Saga or franchise', value: 'franchise' },
          ],
          defaultValue: 'theme',
        }),
        line: fields.text({ label: 'Tagline' }),
        order: fields.integer({ label: 'Order', description: 'Lower numbers show first.', defaultValue: 50 }),
        allUzbek: fields.checkbox({
          label: 'Include all Uzbek films automatically',
          description: 'Ignores the list below and shows every film marked "Uzbek cinema".',
        }),
        films: fields.array(fields.text({ label: 'Film title', description: 'Must match the title in the diary exactly.' }), {
          label: 'Films',
          itemLabel: (p) => p.value,
        }),
      },
    }),

    actors: collection({
      label: 'Leading men',
      slugField: 'name',
      path: 'src/content/actors/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        note: fields.text({ label: 'Why they matter to you', multiline: true }),
        films: fields.array(fields.text({ label: 'Film title', description: 'Must match the title in the diary exactly.' }), {
          label: 'Films',
          itemLabel: (p) => p.value,
        }),
      },
    }),
  },

  singletons: {
    cv: singleton({
      label: 'CV',
      path: 'src/content/cv',
      format: { data: 'json' },
      schema: {
        headline: fields.text({ label: 'Headline', description: 'Your titles, e.g. Student · Founder, Code Caravan' }),
        location: fields.text({ label: 'Location' }),
        email: fields.text({ label: 'Email', description: 'Shown publicly. Leave empty to hide.' }),
        phone: fields.text({ label: 'Phone', description: 'Shown publicly. Leave empty to hide.' }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        stats: fields.array(
          fields.object({
            value: fields.text({ label: 'Number', description: 'e.g. 400+' }),
            label: fields.text({ label: 'Label', description: 'e.g. Participants led' }),
          }),
          { label: 'Highlight numbers', itemLabel: (p) => `${p.fields.value.value} ${p.fields.label.value}` },
        ),
        experience: fields.array(
          fields.object({
            organization: fields.text({ label: 'Organization' }),
            role: fields.text({ label: 'Role' }),
            start: fields.text({ label: 'Start', description: 'e.g. January 2025' }),
            end: fields.text({ label: 'End', description: 'e.g. Present' }),
            place: fields.text({ label: 'Place', description: 'e.g. Fergana, Uzbekistan or Remote' }),
            about: fields.text({ label: 'What the organization is (optional)', description: 'One line for readers who have never heard of it.' }),
            points: fields.array(fields.text({ label: 'Point', multiline: true }), {
              label: 'What you achieved (start with a verb, add a number)',
              itemLabel: (p) => p.value,
            }),
          }),
          { label: 'Experience', itemLabel: (p) => `${p.fields.organization.value} · ${p.fields.role.value}` },
        ),
        education: fields.array(
          fields.object({
            school: fields.text({ label: 'School' }),
            place: fields.text({ label: 'Place' }),
            focus: fields.text({ label: 'Focus', description: 'e.g. Economics and Computer Science' }),
            start: fields.text({ label: 'Start' }),
            end: fields.text({ label: 'End' }),
          }),
          { label: 'Education', itemLabel: (p) => p.fields.school.value },
        ),
        honors: fields.array(
          fields.object({
            title: fields.text({ label: 'Honor' }),
            detail: fields.text({ label: 'Detail', description: 'e.g. Among over 300 students' }),
            year: fields.text({ label: 'Year' }),
          }),
          { label: 'Honors', itemLabel: (p) => `${p.fields.year.value} · ${p.fields.title.value}` },
        ),
        skills: fields.array(fields.text({ label: 'Skill' }), { label: 'Technical skills', itemLabel: (p) => p.value }),
        projects: fields.array(
          fields.object({
            name: fields.text({ label: 'Project' }),
            description: fields.text({ label: 'What it is', multiline: true }),
            tech: fields.text({ label: 'Built with', description: 'e.g. Next.js, Supabase' }),
            github: fields.url({ label: 'GitHub link' }),
            live: fields.url({ label: 'Live link (optional)' }),
          }),
          { label: 'Projects', itemLabel: (p) => p.fields.name.value },
        ),
        tests: fields.array(
          fields.object({
            name: fields.text({ label: 'Test', description: 'e.g. IELTS' }),
            score: fields.text({ label: 'Score' }),
          }),
          { label: 'Test scores', itemLabel: (p) => `${p.fields.name.value} ${p.fields.score.value}` },
        ),
        languages: fields.array(
          fields.object({
            language: fields.text({ label: 'Language' }),
            level: fields.text({ label: 'Level', description: 'e.g. Native' }),
          }),
          { label: 'Languages', itemLabel: (p) => `${p.fields.language.value} · ${p.fields.level.value}` },
        ),
      },
    }),
    site: singleton({
      label: 'Site settings',
      path: 'src/content/site',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Short name', description: 'Shown in the header.' }),
        fullName: fields.text({ label: 'Full name', description: 'Shown big on the landing page.' }),
        role: fields.text({ label: 'Role line', description: 'Shown under your name on the landing page, e.g. Student / Writer / Film lover.' }),
        photo: fields.image({
          label: 'Your photo',
          description: 'Shown in the circle on the landing page. A square photo works best.',
          directory: 'public/images/site',
          publicPath: '/images/site/',
        }),
        tagline: fields.text({ label: 'Tagline', description: 'Used in search results and link previews.' }),
        intro: fields.text({ label: 'Homepage intro', multiline: true }),
        links: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', description: 'e.g. Telegram' }),
            href: fields.text({ label: 'Link', description: 'e.g. https://t.me/username or mailto:you@example.com' }),
            handle: fields.text({ label: 'Shown as', description: 'e.g. @username' }),
          }),
          { label: 'Contact links', itemLabel: (p) => p.fields.label.value || 'New link' },
        ),
      },
    }),
  },
});
