/// <reference types="vite/client" />

// FIX: Correctly type `process.env.API_KEY` by augmenting the existing NodeJS.ProcessEnv interface.
// This avoids redeclaring the global `process` variable which causes type conflicts.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
