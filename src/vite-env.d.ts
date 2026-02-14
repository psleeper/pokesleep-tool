/// <reference types="vite/client" />

declare module '*.txt?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_READONLY_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
