import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: "custom_components/floormap/static/floormap.js",
  sourcemap: false,
  minify: false,
  legalComments: "none",
});

