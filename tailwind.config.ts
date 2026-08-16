import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: { extend: { screens: { board: '1040px' } } },
  plugins: [],
}
export default config
