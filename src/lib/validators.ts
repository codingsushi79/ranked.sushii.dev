import { z } from "zod";
import { isAllowedMatchMode, normalizeMatchMode } from "@/lib/match-modes";

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  acceptedTerms: z.literal(true, {
    error: "You must accept the Terms of Service",
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const matchPlayerSchema = z.object({
  steamId: z.string().optional(),
  userId: z.string().uuid().optional(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  team: z.number().int().min(0).max(1),
  kills: z.number().int().min(0),
  deaths: z.number().int().min(0),
  assists: z.number().int().min(0),
  headshots: z.number().int().min(0).default(0),
  mvps: z.number().int().min(0).default(0),
  damage: z.number().int().min(0).default(0),
  adr: z.number().min(0).default(0),
});

export const matchReportSchema = z.object({
  externalId: z.string().min(1),
  map: z.string().min(1),
  mode: z
    .string()
    .default("competitive")
    .transform((m) => normalizeMatchMode(m) ?? m)
    .refine((m) => isAllowedMatchMode(m), {
      message: "Only Competitive and Premier matches are rated",
    }),
  winnerTeam: z.number().int().min(0).max(1),
  team0Score: z.number().int().min(0).optional(),
  team1Score: z.number().int().min(0).optional(),
  demoShareCode: z.string().optional(),
  demoUrl: z.string().optional(),
  players: z.array(matchPlayerSchema).min(1),
});
