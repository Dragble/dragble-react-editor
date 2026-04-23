import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import dts from "rollup-plugin-dts";

const plugins = [
  peerDepsExternal(),
  resolve(),
  commonjs(),
  typescript({
    tsconfig: "./tsconfig.json",
    declaration: false,
  }),
];

// External dependencies - SDK is bundled, React is external
const external = ["react", "react-dom", "@dragble/editor-sdk"];

// CJS bundle
const cjsBundle = {
  input: "src/index.tsx",
  output: {
    file: "dist/index.js",
    format: "cjs",
    sourcemap: true,
    exports: "named",
  },
  plugins,
  external,
};

// ESM bundle
const esmBundle = {
  input: "src/index.tsx",
  output: {
    file: "dist/index.esm.js",
    format: "esm",
    sourcemap: true,
    exports: "named",
  },
  plugins,
  external,
};

// Type declarations
const dtsBundle = {
  input: "src/index.tsx",
  output: {
    file: "dist/index.d.ts",
    format: "es",
  },
  plugins: [dts()],
  external,
};

export default [cjsBundle, esmBundle, dtsBundle];
