import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get('size') || '192', 10);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: size * 0.01,
        }}
      >
        {/* Character face */}
        <div
          style={{
            width: size * 0.54,
            height: size * 0.54,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #fff7ed, #fed7aa)',
            border: `${Math.max(2, size * 0.015)}px solid rgba(255,255,255,0.8)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Nurse cap */}
          <div
            style={{
              position: 'absolute',
              top: -size * 0.07,
              width: size * 0.2,
              height: size * 0.11,
              background: 'white',
              borderRadius: `${size * 0.02}px ${size * 0.02}px 0 0`,
              border: `${Math.max(1, size * 0.01)}px solid #0d9488`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: '#ef4444', fontSize: size * 0.08, fontWeight: 'bold', display: 'flex' }}>+</div>
          </div>
          {/* Eyes */}
          <div style={{ display: 'flex', gap: size * 0.08, marginTop: -size * 0.02 }}>
            <div style={{ width: size * 0.055, height: size * 0.07, borderRadius: '50%', background: '#1e293b', display: 'flex' }} />
            <div style={{ width: size * 0.055, height: size * 0.07, borderRadius: '50%', background: '#1e293b', display: 'flex' }} />
          </div>
          {/* Eye sparkles */}
          <div style={{ display: 'flex', gap: size * 0.08, marginTop: -size * 0.06, marginLeft: -size * 0.03 }}>
            <div style={{ width: size * 0.02, height: size * 0.02, borderRadius: '50%', background: 'white', display: 'flex' }} />
            <div style={{ width: size * 0.02, height: size * 0.02, borderRadius: '50%', background: 'white', display: 'flex' }} />
          </div>
          {/* Blush */}
          <div style={{ display: 'flex', gap: size * 0.13, marginTop: size * 0.02 }}>
            <div style={{ width: size * 0.06, height: size * 0.035, borderRadius: '50%', background: '#fca5a5', opacity: 0.5, display: 'flex' }} />
            <div style={{ width: size * 0.06, height: size * 0.035, borderRadius: '50%', background: '#fca5a5', opacity: 0.5, display: 'flex' }} />
          </div>
          {/* Smile */}
          <div
            style={{
              width: size * 0.08,
              height: size * 0.04,
              borderRadius: `0 0 ${size * 0.1}px ${size * 0.1}px`,
              background: '#f97316',
              marginTop: -size * 0.005,
              display: 'flex',
            }}
          />
        </div>
        {/* App name */}
        <div
          style={{
            color: 'white',
            fontSize: size * 0.15,
            fontWeight: 900,
            marginTop: size * 0.01,
            display: 'flex',
          }}
        >
          당비서
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
