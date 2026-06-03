import axios from 'axios';

// Production Vercel Backend Link
const API_URL = 'https://movie-sphere-lake.vercel.app';

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true 
});

export default API;
