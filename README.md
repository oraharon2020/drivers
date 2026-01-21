# נלה - מערכת ניהול משלוחים

מערכת ניהול משלוחים ללוגיסטיקה של חברת נלה, מבוססת Next.js.

## התקנה

```bash
cd nalla-nextjs
npm install
```

## הרצה

### פיתוח
```bash
npm run dev
```

### בנייה לפרודקשן
```bash
npm run build
npm start
```

## מבנה הפרויקט

```
src/
├── app/                    # דפי האפליקציה (App Router)
│   ├── api/               # API Routes
│   │   ├── auth/          # אימות משתמשים
│   │   ├── deliveries/    # ניהול משלוחים
│   │   ├── orders/        # הזמנות WooCommerce
│   │   ├── upload/        # העלאת קבצים
│   │   └── status-settings/ # הגדרות סטטוסים
│   ├── admin-settings/    # דף הגדרות מנהל
│   ├── driver-schedule/   # לוח משלוחים
│   ├── login/             # דף התחברות
│   └── order-details/     # פרטי הזמנה
├── components/            # רכיבי React
│   ├── forms/            # טפסים (חתימה, העלאת קבצים)
│   ├── layout/           # רכיבי layout (Navbar)
│   └── ui/               # רכיבי UI (Loader)
├── lib/                   # ספריות צד שרת
│   ├── auth.ts           # אימות JWT ו-WordPress
│   ├── config.ts         # הגדרות
│   ├── db.ts             # חיבור מסד נתונים
│   ├── google-drive.ts   # העלאה ל-Google Drive
│   └── woocommerce.ts    # WooCommerce API
├── types/                 # הגדרות TypeScript
└── utils/                 # פונקציות עזר
    ├── api.ts            # קריאות API מהקליינט
    └── helpers.ts        # פונקציות עזר כלליות
```

## תכונות

- 🔐 אימות משתמשים עם JWT
- 📦 חיבור ל-WooCommerce API (שתי חנויות)
- 📱 עיצוב רספונסיבי עם Tailwind CSS
- ✍️ טפסי חתימה דיגיטליים
- 📎 העלאת קבצים ל-Google Drive
- 📊 לוח משלוחים יומי
- 🔄 עדכון סטטוסים בזמן אמת

## הגדרות סביבה

צור קובץ `.env.local` עם הערכים הבאים:

```env
# Database
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=

# WooCommerce Store 1
WC_STORE_URL_1=
WC_CONSUMER_KEY_1=
WC_CONSUMER_SECRET_1=

# WooCommerce Store 2
WC_STORE_URL_2=
WC_CONSUMER_KEY_2=
WC_CONSUMER_SECRET_2=

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=

# JWT
JWT_SECRET=

# Site
NEXT_PUBLIC_SITE_URL=
```

## טכנולוגיות

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- MySQL2
- JWT Authentication
- Google Drive API
- WooCommerce REST API
