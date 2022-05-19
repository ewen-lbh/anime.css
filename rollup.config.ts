import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"

export default defineConfig({
  input: "index.ts",
  output: {
    format: "cjs",
  },
  plugins: [typescript()],
})
