import { Config } from "@remotion/cli/config";
Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
// No GPU on a typical VDS: Chrome composites on one core, so more tabs don't help much.
Config.setConcurrency(4);
