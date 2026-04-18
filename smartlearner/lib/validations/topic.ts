import { z } from "zod";

export const topicCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Topic title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z.string().max(500).optional(),
  rawNotes: z.string().max(5000, "Notes must be 5000 characters or less").optional(),
  emoji: z.string().default("📚"),
  color: z.string().default("#6C47FF"),
});

export const topicUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "paused", "mastered"]).optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
});

export type TopicCreateInput = z.infer<typeof topicCreateSchema>;
export type TopicUpdateInput = z.infer<typeof topicUpdateSchema>;
