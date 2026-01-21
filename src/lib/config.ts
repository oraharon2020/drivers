export const config = {
  db: {
    host: process.env.DB_HOST || '167.172.191.47',
    user: process.env.DB_USER || 'rkjcuwqssf',
    password: process.env.DB_PASS || 'RwwgUA2Wf8',
    database: process.env.DB_NAME || 'rkjcuwqssf',
  },
  stores: {
    '1': {
      name: 'בלאנו רהיטים',
      url: process.env.WC_STORE_URL_1 || 'https://admin.bellano.co.il',
      consumerKey: process.env.WC_CONSUMER_KEY_1 || '',
      consumerSecret: process.env.WC_CONSUMER_SECRET_1 || '',
    },
    '2': {
      name: 'נלה',
      url: process.env.WC_STORE_URL_2 || 'https://admin.nalla.co.il',
      consumerKey: process.env.WC_CONSUMER_KEY_2 || '',
      consumerSecret: process.env.WC_CONSUMER_SECRET_2 || '',
    },
  },
  googleDrive: {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '122sdfafs-cascq34-axcaefqsf-1234dqsac',
  },
  defaultStoreId: '1',
} as const;

export type StoreId = '1' | '2';

export function getStoreConfig(storeId: StoreId) {
  return config.stores[storeId];
}

export function detectStoreId(orderId: string): StoreId {
  // If order ID starts with 3 or 4, it's Nalla (store 2)
  if (/^[34]/.test(orderId)) {
    return '2';
  }
  return '1';
}
