import vue from "@vitejs/plugin-vue2";
import type { Plugin as VitePlugin } from "vite";
import * as compiler from "vue/compiler-sfc";

export function vue2Plugin(): VitePlugin {
  /* eslint-disable @typescript-eslint/no-unsafe-return -- ? */
  // @ts-expect-error -- ?
  return vue({ compiler });
  /* eslint-enable @typescript-eslint/no-unsafe-return -- ? */
}
