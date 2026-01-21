import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { createWooCommerceAPI } from '@/lib/woocommerce';
import { detectStoreId, StoreId } from '@/lib/config';

export const dynamic = 'force-dynamic';

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
    const orderId = searchParams.get('order_id');
    let storeId = searchParams.get('store_id') as StoreId | null;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'מזהה הזמנה נדרש' },
        { status: 400 }
      );
    }

    // Auto-detect store if not provided
    if (!storeId || !['1', '2'].includes(storeId)) {
      storeId = detectStoreId(orderId);
    }

    const api = createWooCommerceAPI(storeId);
    const order = await api.getOrderWithNotes(orderId);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        store_info: {
          id: storeId,
          name: storeId === '1' ? 'בלאנו רהיטים' : 'נלה',
        },
      },
    });
  } catch (error) {
    console.error('Orders API error:', error);
    const message = error instanceof Error ? error.message : 'שגיאה בטעינת ההזמנה';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'אין טוקן הרשאה' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { order_id, store_id, status } = body;

    if (!order_id || !status) {
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
    const order = await api.updateOrderStatus(order_id, status);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update status error:', error);
    const message = error instanceof Error ? error.message : 'שגיאה בעדכון הסטטוס';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
