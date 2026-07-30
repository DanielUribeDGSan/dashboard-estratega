import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.PUBLIC_ANALYTICS_PROXY_URL || '/.netlify/functions/analytics',
  headers: {
    'Content-Type': 'application/json'
  }
});
