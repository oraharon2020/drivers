import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { generateToken, verifyWordPressPassword } from '@/lib/auth';

interface WPUser {
  ID: number;
  user_login: string;
  user_pass: string;
}

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

    // Find user in database
    const user = await queryOne<WPUser>(
      `SELECT ID, user_login, user_pass 
       FROM wp_users 
       WHERE (user_login = ? OR user_email = ?) 
       AND user_status = 0`,
      [username.trim(), username.trim()]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'שם משתמש או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = verifyWordPressPassword(password.trim(), user.user_pass);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'שם משתמש או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      user_id: user.ID,
      username: user.user_login,
    });

    return NextResponse.json({
      success: true,
      token,
      username: user.user_login,
    });
  } catch (error: unknown) {
    console.error('Auth error:', error);
    
    // Check for connection errors
    if (error && typeof error === 'object' && 'code' in error) {
      const err = error as { code: string };
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { success: false, message: 'שגיאת חיבור למסד הנתונים - נסה שוב מאוחר יותר' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
