import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'API_ERROR',
          message: 'Token authentication failed: parameters missing',
        },
        { status: 400 }
      );
    }

    // Decode and verify secure token parameters
    let tokenData;
    try {
      const decodedStr = Buffer.from(token, 'base64').toString('utf-8');

      const lastDot = decodedStr.lastIndexOf('.');
      if (lastDot === -1) {
        return NextResponse.json(
          {
            success: false,
            error: 'API_ERROR',
            message: 'Token authentication failed: signature missing',
          },
          { status: 400 }
        );
      }

      const payloadStr = decodedStr.substring(0, lastDot);
      const signature = decodedStr.substring(lastDot + 1);

      const secret = process.env.NEXTAUTH_SECRET || 'secret-key';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadStr)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json(
          {
            success: false,
            error: 'TOKEN_TAMPERED',
            message: 'Token authentication failed: cryptographic signature mismatch',
          },
          { status: 401 }
        );
      }

      tokenData = JSON.parse(payloadStr);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Token authentication failed: parse error' },
        { status: 400 }
      );
    }

    const { key, expiresAt } = tokenData;

    if (!key || !expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'API_ERROR',
          message: 'Token authentication failed: corrupt parameters',
        },
        { status: 400 }
      );
    }

    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'TOKEN_EXPIRED', message: 'The secure upload token has expired.' },
        { status: 401 }
      );
    }

    // Secure path traversal guard check
    const resolvedPath = path.resolve(process.cwd(), 'public', 'uploads', key);
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!resolvedPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        {
          success: false,
          error: 'PATH_TRAVERSAL_DETECTED',
          message: 'Forbidden directory traversal path',
        },
        { status: 403 }
      );
    }

    // Convert request payload to buffer stream
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const directory = path.dirname(resolvedPath);

    // Auto-create directory directories if they do not exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write file securely to disk
    fs.writeFileSync(resolvedPath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Binary successfully written to disk emulator.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
