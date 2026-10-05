---
title: How to write a post
description: A sample post showing the format. It only appears while you run the site locally.
date: 2026-10-05
tags: [guide]
draft: true
---

This is a sample post. Because it says `draft: true` at the top, it shows up only on your computer (`npm run dev`) and never on the published site. Delete this file once you've written your first real post.

## Making a new post

Create a new file in `src/content/blog/`, for example `why-i-started-turonmun.md`. The file name becomes the link: `/blog/why-i-started-turonmun`.

Start the file with this header:

```
---
title: Why I started TuronMUN
description: One sentence that shows up in previews.
date: 2026-10-12
tags: [leadership, mun]
---
```

Then write normally below it.

## Formatting

Use `##` for section headings, `**bold**` for bold, and `> ` for a pull quote:

> A quote looks like this, big and in serif.

## Writing a movie reflection

Write a normal post, then open `src/data/movies.js` and add `post: 'your-post-file-name'` to that film. Its poster will get a "Read reflection" link. For example:

```
m('Dead Poets Society', 1989, { post: 'dead-poets-society' }),
```
