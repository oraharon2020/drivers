import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { createWooCommerceAPI } from '@/lib/woocommerce';
import { StoreId } from '@/lib/config';

// Custom statuses for each store
const customStatuses: Record<StoreId, string[]> = {
  '1': [
    'done-sharon', 'done-rafi', 'done-alex', 'done-bachti', 'done-farid', 
    'done-ariel', 'done-lior', 'done-dvir', 'done-nikos', 'done-dima',
    'nikos-toam', 'farid-toam', 'sharon-toam', 'aviel-toam', 'joni-toam',
    'un-adir', 'un-shlomi', 'un-joni', 'un-adam', 'un-warehouse',
    'north-delivery', 'south-delivery', 'shipping-center', 'sharon-delivery', 
    'jerusalem-deliver', 'preparation', 'joni', 'adam', 'mitot', 'adiv', 
    'customer-visit', 'pickup', 'phone-payment'
  ],
  '2': [
    'done-sharon', 'done-alex', 'done-bachti', 'done-farid', 'done-ariel', 
    'done-lior', 'done-dvir', 'done-dima', 'done-nikos',
    'nikos-toam', 'farid-toam', 'sharon-toam', 'aviel-toam', 'joni-toam', 
    'lior-toam', 'dima-toam',
    'un-adir', 'un-shlomi', 'un-joni', 'un-adam', 'un-warehouse', 'un-ben',
    'north-delivery', 'south-delivery', 'shipping-center', 'sharon-delivery', 
    'jerusalem-deliver', 'preparation', 'shipping', 'phone-payment', 
    'happycustomer', 'adam', 'joni', 'nikos', 'change-order-cust',
    'customer-visit', 'late-delivery', 'radom', 'mlay', 'delivey-date', 
    'adiv', 'mitot', 'pickup', 'nikus-fix', 'sharon-fix', 'lior-fix', 
    'betipol-eli-or', 'rapad', 'bid', 'customrt-visit-14', 'ben'
  ],
};

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'אין טוקן הרשאה' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const storeId = searchParams.get('store_id') as StoreId;

    if (action === 'get_all_statuses') {
      // Get statuses from both stores
      const api1 = createWooCommerceAPI('1');
      const api2 = createWooCommerceAPI('2');

      let store1Statuses: string[] = [];
      let store2Statuses: string[] = [];

      try {
        const result1 = await api1.getOrderStatuses();
        store1Statuses = result1.map((s) => s.slug.replace('wc-', ''));
      } catch (e) {
        console.error('Error fetching store 1 statuses:', e);
      }

      try {
        const result2 = await api2.getOrderStatuses();
        store2Statuses = result2.map((s) => s.slug.replace('wc-', ''));
      } catch (e) {
        console.error('Error fetching store 2 statuses:', e);
      }

      // Merge with custom statuses
      const bellanoStatuses = [...new Set([...store1Statuses, ...customStatuses['1']])];
      const nallaStatuses = [...new Set([...store2Statuses, ...customStatuses['2']])];

      return NextResponse.json({
        success: true,
        bellano: bellanoStatuses,
        nalla: nallaStatuses,
      });
    }

    if (action === 'get_store_statuses' && storeId) {
      const api = createWooCommerceAPI(storeId);
      const result = await api.getOrderStatuses();

      const apiStatuses = result.map((s) => s.slug.replace('wc-', ''));
      const allStatuses = [...new Set([...apiStatuses, ...customStatuses[storeId]])];

      return NextResponse.json({
        success: true,
        data: allStatuses,
      });
    }

    return NextResponse.json(
      { success: false, message: 'פעולה לא נתמכת' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Status settings error:', error);
    const message = error instanceof Error ? error.message : 'שגיאה בטעינת הסטטוסים';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
