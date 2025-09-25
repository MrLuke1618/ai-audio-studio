import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // FIX: Replaced `process.cwd()` with `''` to resolve a TypeScript error where 'cwd' was not found on 'process'.
  // Passing an empty string for the directory makes loadEnv default to the project root, which is the desired behavior.
  const env = loadEnv(mode, '', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    // IMPORTANT: Replace 'ai-audio-studio' with your exact GitHub repository name
    base: '/ai-audio-studio/',
  }
})
