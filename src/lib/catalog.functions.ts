import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getPublicProgram,
  listPublicEvents,
  listPublicPrograms,
} from "@/lib/catalog.server";

export const listPrograms = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ kind: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }) => listPublicPrograms(data.kind));

export const getProgram = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => getPublicProgram(data.id));



export const listEvents = createServerFn({ method: "GET" }).handler(listPublicEvents);
