import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const papers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/papers' }),
  schema: ({ image }) =>
    z.object({
    title: z.string(),
    authors: z.string(),
    venue: z.string(),
    year: z.number(),
    order: z.number(),          // explicit display order (lower = earlier in the grid)
    doi: z.string().optional(),
    url: z.string().url(),
    figure: image().optional(), // an actual figure; if omitted, the in-progress placeholder is shown
    figureBg: z.string().optional(), // figure frame/mat colour; any CSS colour, "transparent" for none; omit = default
  }),
});

export const collections = { papers };
