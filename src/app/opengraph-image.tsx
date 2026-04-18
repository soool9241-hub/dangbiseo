import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '당비서 - 24시간 함께하는 당뇨 관리 비서';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 30%, #5eead4 70%, #99f6e4 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 80, left: 100, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex' }} />

        {/* Main content card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 50,
            padding: '40px 60px',
            borderRadius: 32,
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Character */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Character body - cute round shape */}
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #fff7ed 0%, #fed7aa 100%)',
                border: '4px solid #fb923c',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Eyes */}
              <div style={{ display: 'flex', gap: 28, marginTop: -10 }}>
                <div style={{ width: 20, height: 24, borderRadius: '50%', background: '#1e293b', display: 'flex' }} />
                <div style={{ width: 20, height: 24, borderRadius: '50%', background: '#1e293b', display: 'flex' }} />
              </div>
              {/* Eye sparkles */}
              <div style={{ display: 'flex', gap: 28, marginTop: -22, marginLeft: -12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', display: 'flex' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', display: 'flex' }} />
              </div>
              {/* Blush */}
              <div style={{ display: 'flex', gap: 50, marginTop: 6 }}>
                <div style={{ width: 24, height: 14, borderRadius: '50%', background: '#fca5a5', opacity: 0.6, display: 'flex' }} />
                <div style={{ width: 24, height: 14, borderRadius: '50%', background: '#fca5a5', opacity: 0.6, display: 'flex' }} />
              </div>
              {/* Smile */}
              <div
                style={{
                  width: 30,
                  height: 15,
                  borderRadius: '0 0 50px 50px',
                  background: '#f97316',
                  marginTop: -2,
                  display: 'flex',
                }}
              />
            </div>
            {/* Nurse cap */}
            <div
              style={{
                position: 'absolute',
                top: -20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 45,
                  background: 'white',
                  borderRadius: '8px 8px 0 0',
                  border: '3px solid #0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ color: '#ef4444', fontSize: 28, fontWeight: 'bold', display: 'flex' }}>+</div>
              </div>
            </div>
            {/* Stethoscope hint */}
            <div
              style={{
                marginTop: -8,
                fontSize: 16,
                color: '#0d9488',
                fontWeight: 700,
                display: 'flex',
              }}
            >
              🩺
            </div>
          </div>

          {/* Text content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: '#0d9488',
                lineHeight: 1.1,
                display: 'flex',
              }}
            >
              당비서
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: '#475569',
                lineHeight: 1.4,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span>24시간 함께하는</span>
              <span>당뇨 관리 비서</span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 8,
              }}
            >
              {['혈당기록', 'AI식단분석', '인슐린관리'].map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: '#f0fdfa',
                    color: '#0d9488',
                    fontSize: 16,
                    fontWeight: 600,
                    border: '1.5px solid #99f6e4',
                    display: 'flex',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            color: 'rgba(255,255,255,0.9)',
            fontSize: 20,
            fontWeight: 500,
            display: 'flex',
          }}
        >
          늘 여러분의 곁에서 24시간 여러분을 지키는 당비서
        </div>
      </div>
    ),
    { ...size }
  );
}
