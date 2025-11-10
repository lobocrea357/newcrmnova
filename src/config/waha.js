import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WAHA_URL = process.env.WAHA_BASE_URL || 'http://localhost:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

if (!WAHA_API_KEY) {
  throw new Error('Falta WAHA_API_KEY en el archivo .env');
}

export const wahaClient = axios.create({
  baseURL: WAHA_URL,
  headers: {
    'X-Api-Key': WAHA_API_KEY,
    'Content-Type': 'application/json'
  }
});

export default wahaClient;
