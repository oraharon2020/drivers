import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { Delivery } from '@/types';

export const dynamic = 'force-dynamic';

const PROXY_URL = 'https://driver.nalla.co.il/api-proxy.php';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'אין טוקן הרשאה' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, message: 'נדרש להעביר תאריך' },
        { status: 400 }
      );
    }

    // Call the PHP proxy API
    const proxyResponse = await fetch(
      `${PROXY_URL}?action=get_deliveries&date=${date}&user_id=${user.user_id}`
    );
    
    const proxyData = await proxyResponse.json();
    
    if (!proxyData.success) {
      return NextResponse.json(
        { success: false, message: proxyData.message || 'שגיאה בטעינת המשלוחים' },
        { status: 500 }
      );
    }

    const deliveries: Delivery[] = (proxyData.data || []).map((row: Record<string, unknown>) => ({
      id: row.id as number,
      order_id: row.order_id as string,
      store_id: row.store_id as string,
      store_name: (row.store_name as string) || 'לא ידוע',
      order_number: (row.order_number as string) || (row.order_id as string),
      shipping_address: (row.shipping_address as string) || 'לא זמין',
      phone: (row.phone as string) || 'לא זמין',
      time_slot: (row.time_slot as string) || 'לא נקבע',
      customer_name: (row.customer_name as string) || 'לא זמין',
      status: (row.status as string) || 'pending',
      total_items: (row.total_items as number) || 0,
      products: row.products ? JSON.parse(row.products as string) : [],
    }));

    return NextResponse.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error('Deliveries API error:', error);
    return NextResponse.json(
      { success: false, message: 'שגיאה בטעינת המשלוחים' },
      { status: 500 }
    );
  }
}
