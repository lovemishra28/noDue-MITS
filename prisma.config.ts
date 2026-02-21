import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // We use the direct URL here because terminal commands 
    // need a direct connection to create tables in Supabase.
    url: env("DIRECT_URL"),
  },
});