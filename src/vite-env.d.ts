// FIX: Replaced the original content (`/// <reference types="vite/client" />`) which caused a resolution error.
// This declaration provides a type for `process.env.API_KEY` to satisfy TypeScript.
// Vite's `define` config handles the actual value replacement at build time.
declare var process: {
  env: {
    API_KEY: string;
  };
};
