import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: [
    "@langchain/core",
    "langchain",
    "@covalenthq/client-sdk",
    "zod",
  ],
  treeshake: true,
});
