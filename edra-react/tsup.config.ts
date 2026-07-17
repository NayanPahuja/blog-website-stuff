import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    /@tiptap\//,
    /@radix-ui\//,
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'katex',
    'lowlight',
    'mermaid',
    /@floating-ui\//,
  ],
})
