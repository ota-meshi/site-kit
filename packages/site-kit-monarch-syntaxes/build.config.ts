import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  outDir: "lib",
  externals: ["monaco-editor"],
});
