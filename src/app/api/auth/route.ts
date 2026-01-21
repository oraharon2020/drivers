import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'שם משתמש וסיסמה הם שדות חובה' },
        { status: 400 }
      );
    }

    // Try to authenticate via WordPress REST API
    // Using admin.nalla.co.il WordPress
    const wpUrl = config.stores['2'].url; // admin.nalla.co.il
    
    // WordPress JWT Authentication or Application Passwords
    const authResponse = await fetch(`${wpUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
      }),
    });

    if (authResponse.ok) {
      const wpData = await authResponse.json();
      
      // Generate our own JWT token
      const token = generateToken({
        user_id: wpData.user_id || 1,
        username: wpData.user_nicename || username,
      });

      return NextResponse.json({
        success: true,
        token,
        username: wpData.user_nicename || username,
      });
    }

    // If JWT plugin not installed, try basic auth validation
    const basicAuthResponse = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username.trim()}:${password.trim()}`).toString('base64'),
      },
    });

    if (basicAuthResponse.ok) {
      const userData = await basicAuthResponse.json();
      
      const token = generateToken({
        user_id: userData.id,
        username: userData.slug || username,
      });

      return NextResponse.json({
        success: true,
        token,
        username: userData.slug || username,
      });
    }

    return NextResponse.json(
      { success: false, message: 'שם משתמש או סיסמה שגויים' },
      { status: 401 }
    );
  } catch (error: unknown) {
    console.error('Auth error:', error);
    
    return NextResponse.json(
      { success: false, message: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
