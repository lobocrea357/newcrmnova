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
    'Content-Type': 'application/json',
    'User-Agent': 'CRM-Nova-Bot/1.0',
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  },
  timeout: 300000, // 5 minutos timeout para servidor remoto
  maxRedirects: 10,
  maxContentLength: 50 * 1024 * 1024, // 50MB max response
  maxBodyLength: 50 * 1024 * 1024, // 50MB max request
  validateStatus: status => status < 500,
  decompress: true,
  transitional: {
    silentJSONParsing: false,
    forcedJSONParsing: true,
    clarifyTimeoutError: true
  }
});

export default wahaClient;
