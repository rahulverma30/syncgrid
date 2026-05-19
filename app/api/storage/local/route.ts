import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token authentication failed: parameters missing' },
        { status: 400 }
      );
    }

    // Decode and verify secure token parameters
    let tokenData;
    try {
      const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
      tokenData = JSON.parse(decodedStr);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Token authentication failed: parse error' },
        { status: 400 }
      );
    }

    const { key, expiresAt } = tokenData;

    if (!key || !expiresAt) {
      return NextResponse.json(
        { success: false, message: 'Token authentication failed: corrupt parameters' },
        { status: 400 }
      );
    }

    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'TOKEN_EXPIRED', message: 'The secure upload token has expired.' },
        { status: 401 }
      );
    }

    // Convert request payload to buffer stream
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to the public/uploads directory
    const uploadFilePath = path.join(process.cwd(), 'public', 'uploads', key);
    const directory = path.dirname(uploadFilePath);

    // Auto-create directory directories if they do not exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write file securely to disk
    fs.writeFileSync(uploadFilePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Binary successfully written to disk emulator.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
