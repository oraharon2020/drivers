import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { Delivery } from '@/types';

interface DeliveryRow {
  id: number;
  order_id: string;
  store_id: string;
  store_name: string | null;
  order_number: string | null;
  shipping_address: string | null;
  phone: string | null;
  time_slot: string | null;
  customer_name: string | null;
  status: string | null;
  total_items: number;
  products: string | null;
}

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

    const rows = await query<DeliveryRow>(
      `SELECT 
        da.*,
        COALESCE(da.store_name, 
          CASE 
            WHEN da.store_id = '1' THEN 'בלאנו'
            WHEN da.store_id = '2' THEN 'נלה'
            ELSE 'לא ידוע'
          END
        ) as store_name
      FROM wp_delivery_assignments da
      WHERE da.driver_id = ?
      AND DATE(da.delivery_date) = ?
      ORDER BY da.sequence ASC, da.id ASC`,
      [user.user_id, date]
    );

    const deliveries: Delivery[] = rows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      store_id: row.store_id,
      store_name: row.store_name || 'לא ידוע',
      order_number: row.order_number || row.order_id,
      shipping_address: row.shipping_address || 'לא זמין',
      phone: row.phone || 'לא זמין',
      time_slot: row.time_slot || 'לא נקבע',
      customer_name: row.customer_name || 'לא זמין',
      status: row.status || 'pending',
      total_items: row.total_items || 0,
      products: row.products ? JSON.parse(row.products) : [],
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
