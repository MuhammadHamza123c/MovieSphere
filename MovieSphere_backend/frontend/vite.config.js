import axios from 'axios';

// Automatically detects if you are developing locally or running live on Vercel
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = isLocal 
  ? 'http://localhost:8000' 
  : 'https://movie-sphere-lake.vercel.app';

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true // Ensures secure HTTP-only cookies/sessions carry over properly
});

export default API;
