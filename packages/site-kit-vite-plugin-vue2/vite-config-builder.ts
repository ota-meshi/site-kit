import vue from "@vitejs/plugin-vue2";
import type { Plugin as VitePlugin } from "vite";
import * as compiler from "vue/compiler-sfc";

export function vue2Plugin(): VitePlugin {
  // @ts-expect-error -- ?
  return vue({ compiler });
}
