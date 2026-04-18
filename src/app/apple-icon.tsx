import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {/* Cute character face */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #fff7ed, #fed7aa)',
            border: '3px solid rgba(255,255,255,0.8)',
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
              top: -14,
              width: 38,
              height: 24,
              background: 'white',
              borderRadius: '6px 6px 0 0',
              border: '2px solid #0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', display: 'flex' }}>+</div>
          </div>
          {/* Eyes */}
          <div style={{ display: 'flex', gap: 16, marginTop: -2 }}>
            <div style={{ width: 11, height: 13, borderRadius: '50%', background: '#1e293b', display: 'flex' }} />
            <div style={{ width: 11, height: 13, borderRadius: '50%', background: '#1e293b', display: 'flex' }} />
          </div>
          {/* Sparkles */}
          <div style={{ display: 'flex', gap: 16, marginTop: -12, marginLeft: -6 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'white', display: 'flex' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'white', display: 'flex' }} />
          </div>
          {/* Blush */}
          <div style={{ display: 'flex', gap: 28, marginTop: 4 }}>
            <div style={{ width: 14, height: 8, borderRadius: '50%', background: '#fca5a5', opacity: 0.6, display: 'flex' }} />
            <div style={{ width: 14, height: 8, borderRadius: '50%', background: '#fca5a5', opacity: 0.6, display: 'flex' }} />
          </div>
          {/* Smile */}
          <div
            style={{
              width: 16,
              height: 8,
              borderRadius: '0 0 30px 30px',
              background: '#f97316',
              marginTop: -1,
              display: 'flex',
            }}
          />
        </div>
        {/* App name */}
        <div
          style={{
            color: 'white',
            fontSize: 28,
            fontWeight: 900,
            marginTop: 2,
            display: 'flex',
          }}
        >
          당비서
        </div>
      </div>
    ),
    { ...size }
  );
}
