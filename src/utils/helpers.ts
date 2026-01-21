// Format price in ILS
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
  }).format(numPrice);
}

// Format date in Hebrew
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format date for input (YYYY-MM-DD)
export function formatDateForInput(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

// Get current username from token
export function getCurrentUsername(): string {
  if (typeof window === 'undefined') return 'משתמש לא ידוע';

  try {
    const token = localStorage.getItem('token');
    if (!token) return 'משתמש לא ידוע';

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || 'משתמש לא ידוע';
  } catch {
    return 'משתמש לא ידוע';
  }
}

// Status label translation
export function getStatusLabel(status: string): string {
  const namesMap: Record<string, string> = {
    alex: 'אלכס',
    bachti: 'בכטי',
    farid: 'פריד',
    ariel: 'אריאל',
    sharon: 'שרון',
    dvir: 'דביר',
    lior: 'ליאור',
    shlomi: 'שלומי',
    adir: 'אדיר',
    adam: 'אדם',
    joni: "ג'וני",
    ben: 'בן',
    nikos: 'ניקוס',
    dima: 'ארטיום',
    rafi: 'רפי',
  };

  const parts = status.split('-');
  if (parts.length < 2) return status;

  const [type, name] = parts;
  const translatedName = namesMap[name] || name;

  if (type === 'done') {
    return `הושלם - ${translatedName}`;
  } else if (type === 'un') {
    return `לא נמסר - ${translatedName}`;
  } else if (type.includes('toam')) {
    return `תואם - ${translatedName}`;
  }

  return status;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

// Get auth token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Set auth data
export function setAuthData(token: string, username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
}

// Clear auth data
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}

// Detect store from order ID
export function detectStoreFromOrderId(orderId: string): '1' | '2' {
  if (/^[34]/.test(orderId)) {
    return '2';
  }
  return '1';
}
