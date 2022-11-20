import type { Plugin as VitePlugin } from "vite";

export default function bundleCssPlugin({
  fileName,
}: {
  fileName: string;
}): VitePlugin {
  const jsFileName = `${fileName}.js`;
  return {
    apply: "build",
    enforce: "post",
    name: "bundle-css",
    generateBundle(_, bundle) {
      const cssFileName = "style.css";
      const { [cssFileName]: cssBundle, [jsFileName]: jsBundle } = bundle;
      if (cssBundle?.type === "asset" && jsBundle?.type === "chunk") {
        const cssCode = `
;(function() {
try {
var elementStyle = document.createElement('style');
elementStyle.innerText = ${JSON.stringify(cssBundle.source)};
document.head.appendChild(elementStyle);
} catch(error) {
console.error(error, 'unable to concat style inside the bundled file')
}
})()`;
        delete bundle[cssFileName];
        jsBundle.code += cssCode;
      }
    },
  };
}
