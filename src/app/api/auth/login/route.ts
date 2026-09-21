import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'data.json');

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // 1. Check if platform
    const platformUsername = process.env.platform_USERNAME || 'platform';
    const platformPassword = process.env.platform_PASSWORD || 'platform123';

    if (
      username.toLowerCase() === platformUsername.toLowerCase() &&
      password === platformPassword
    ) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'platform-1',
          name: 'Super Administrator',
          email: `${platformUsername}@system.local`,
          role: 'platform',
        },
      });
    }

    // 2. Check if Cafe Owner
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const cafes = data.cafes || [];

    // Check old admin credentials fallback for testing without DB integration
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@cornerroastery.com';
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';

    if (
      (username.toLowerCase() === adminEmail.toLowerCase() || username.toLowerCase() === 'admin') &&
      password === adminPassword
    ) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin-1',
          name: 'Corner Roastery Owner',
          email: adminEmail,
          role: 'owner',
        },
      });
    }

    const matchedCafe = cafes.find(
      (cafe: any) =>
        cafe.username.toLowerCase() === username.toLowerCase() &&
        cafe.password === password
    );

    if (matchedCafe) {
      return NextResponse.json({
        success: true,
        user: {
          id: `owner-${matchedCafe.id}`,
          name: matchedCafe.ownerName || 'Cafe Owner',
          email: `${matchedCafe.username}@cafe.local`,
          role: 'owner',
          cafeId: matchedCafe.id,
        },
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
