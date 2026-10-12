import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
if (!BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.error(
    "[HealthTwin] REACT_APP_BACKEND_URL is not set. Create frontend/.env with " +
      "REACT_APP_BACKEND_URL=http://localhost:8001 (or your API host) and restart yarn start."
  );
}
export const API = `${BACKEND_URL || ""}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ht_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("ht_token");
      localStorage.removeItem("ht_user");
    }
    return Promise.reject(err);
  }
);

export default client;
