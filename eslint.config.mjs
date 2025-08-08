import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import remotion from "@remotion/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ...remotion.flatPlugin,
    rules: {
      ...remotion.flatPlugin.rules,
    },
    files: ["src/remotion/**"],
  },
];

export default eslintConfig;
