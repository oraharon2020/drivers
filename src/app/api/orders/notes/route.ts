import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { createWooCommerceAPI } from '@/lib/woocommerce';
import { detectStoreId, StoreId } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'אין טוקן הרשאה' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { order_id, store_id, note, customer_note } = body;

    if (!order_id || !note) {
      return NextResponse.json(
        { success: false, message: 'שדות חסרים' },
        { status: 400 }
      );
    }

    let finalStoreId = store_id as StoreId;
    if (!finalStoreId || !['1', '2'].includes(finalStoreId)) {
      finalStoreId = detectStoreId(order_id);
    }

    const api = createWooCommerceAPI(finalStoreId);
    const addedNote = await api.addOrderNote(order_id, note, customer_note || false);

    return NextResponse.json({
      success: true,
      data: addedNote,
    });
  } catch (error) {
    console.error('Add note error:', error);
    const message = error instanceof Error ? error.message : 'שגיאה בהוספת הערה';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
