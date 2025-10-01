const DEFAULT_SERVER_URL = 'http://localhost:2567';

const serverUrl = import.meta.env.VITE_SERVER_URL?.trim().replace(/\/$/, '') ?? DEFAULT_SERVER_URL;

export const API_BASE_URL = `${serverUrl}/make-server-b985c1b9`;

export const COLYSEUS_ENDPOINT = serverUrl.replace(/^http/, 'ws');
