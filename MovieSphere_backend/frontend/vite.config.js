import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

import tailwindcss from '@tailwindcss/vite'



export default defineConfig({

  plugins: [react(), tailwindcss()],

  server: {

    proxy: {

      '/auth': 'https://movie-sphere-lake.vercel.app/',

      '/MovieSphere': 'https://movie-sphere-lake.vercel.app/'

    }

  }

}) 

