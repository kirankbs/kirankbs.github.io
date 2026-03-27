import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    readTime: z.string(),
    excerpt: z.string(),
    tags: z.array(z.string()),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    tags: z.array(z.string()),
    githubUrl: z.string().optional(),
  }),
});

const ebook = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    chapter: z.number(),
    part: z.number().optional(),
    partTitle: z.string().optional(),
    status: z.enum(['draft', 'review', 'published']).default('draft'),
    excerpt: z.string(),
    estimatedReadTime: z.string().optional(),
    lastUpdated: z.string(),
    blogPostRef: z.string().optional(),
    dataset: z.string().optional(),
    learningObjectives: z.array(z.string()).optional(),
    substackUrl: z.string().url().optional(),
    free: z.boolean().optional(),
  }),
});

export const collections = { blog, projects, ebook };
