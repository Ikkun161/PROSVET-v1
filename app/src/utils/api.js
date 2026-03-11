import { authEvents } from './authEvents';

const API_BASE = 'http://localhost:8000';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // Добавляем Content-Type только если тело не FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    console.log(`apiFetch: запрос к ${API_BASE}${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    console.log('apiFetch: статус ответа', response.status);

    if (response.status === 401) {
      localStorage.removeItem('token');
      authEvents.triggerUnauthorized();
    }

    return response;
  } catch (error) {
    console.error('apiFetch: ошибка сети', error);
    throw error;
  }
}