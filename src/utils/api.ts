import { getAuthToken } from './helpers';
import type { ApiResponse, WCOrder, Delivery, UploadResult } from '@/types';

const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...fetchOptions.headers,
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'שגיאה בבקשה');
  }

  return data;
}

// Auth API
export async function login(username: string, password: string) {
  return fetchAPI<{ success: boolean; token?: string; username?: string; message?: string }>(
    '/auth',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false,
    }
  );
}

// Deliveries API
export async function getDeliveries(date: string) {
  return fetchAPI<ApiResponse<Delivery[]>>(`/deliveries?date=${date}`);
}

// Orders API
export async function getOrder(orderId: string, storeId: string) {
  return fetchAPI<ApiResponse<WCOrder>>(
    `/orders?order_id=${orderId}&store_id=${storeId}`
  );
}

export async function updateOrderStatus(orderId: string, storeId: string, status: string) {
  return fetchAPI<ApiResponse<WCOrder>>('/orders', {
    method: 'PUT',
    body: JSON.stringify({ order_id: orderId, store_id: storeId, status }),
  });
}

export async function addOrderNote(
  orderId: string,
  storeId: string,
  note: string,
  customerNote: boolean = false
) {
  return fetchAPI<ApiResponse>('/orders/notes', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      store_id: storeId,
      note,
      customer_note: customerNote,
    }),
  });
}

// Upload API
export async function uploadFile(file: File, orderId: string, storeId: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('order_id', orderId);
  formData.append('store_id', storeId);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return response.json();
}

// Status Settings API
export async function getAllStatuses() {
  return fetchAPI<{ success: boolean; bellano: string[]; nalla: string[] }>(
    '/status-settings?action=get_all_statuses'
  );
}

export async function getStoreStatuses(storeId: string) {
  return fetchAPI<ApiResponse<string[]>>(
    `/status-settings?action=get_store_statuses&store_id=${storeId}`
  );
}
