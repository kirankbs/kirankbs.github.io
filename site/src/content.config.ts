import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    readTime: z.string(),
    excerpt: z.string(),
    tags: z.array(z.string()),
    heroImage: z.string().optional(),
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

const ai = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    kind: z.enum(['essay', 'project', 'note', 'series']),
    tags: z.array(z.string()),
    readTime: z.string().optional(),
    githubUrl: z.string().url().optional(),
    seriesTitle: z.string().optional(),
    part: z.number().optional(),
    status: z.enum(['draft', 'published']).default('published'),
  }),
});

export const collections = { blog, projects, ebook, ai };
