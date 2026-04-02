import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = '皓野 | haoye.cyou'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.10), transparent 24%), radial-gradient(circle at 50% 42%, rgba(255,255,255,0.06), transparent 36%), linear-gradient(180deg, #0b0b0c 0%, #0d0d0d 54%, #111111 100%)',
          color: '#F2F1EE',
          fontFamily:
            '"Noto Serif SC", "Source Han Serif SC", "PingFang SC", serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.015), transparent 20%, transparent 70%, rgba(255,255,255,0.02) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 18%, rgba(130,135,145,0.08), transparent 28%), radial-gradient(circle at 82% 74%, rgba(255,255,255,0.03), transparent 20%)',
            mixBlendMode: 'screen',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '100%',
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(255,255,255,0.08) 28%, rgba(255,255,255,0.025) 58%, transparent 100%)',
              filter: 'blur(22px)',
              opacity: 0.95,
              transform: 'translateX(4px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '260px',
              height: '100%',
              transform: 'translateX(-50%)',
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.045) 32%, transparent 78%)',
              clipPath: 'polygon(49% 0%, 51% 0%, 74% 100%, 26% 100%)',
              filter: 'blur(42px)',
              opacity: 0.82,
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '78px 86px 72px 86px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <div
              style={{
                fontSize: 18,
                letterSpacing: '0.22em',
                color: 'rgba(210,206,198,0.52)',
                display: 'flex',
              }}
            >
              PERSONAL DIGITAL SPACE
            </div>

            <div
              style={{
                fontSize: 76,
                lineHeight: 1.12,
                fontWeight: 300,
                letterSpacing: '0.06em',
                display: 'flex',
              }}
            >
              皓野
            </div>

            <div
              style={{
                maxWidth: '720px',
                fontSize: 30,
                lineHeight: 1.75,
                color: 'rgba(225,221,213,0.78)',
                display: 'flex',
              }}
            >
              诗、图像，以及没有说完的沉默。
            </div>
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '22px',
                fontSize: 34,
                letterSpacing: '0.12em',
                color: 'rgba(242,241,238,0.88)',
              }}
            >
              <span style={{ opacity: 0.66 }}>诗</span>
              <span style={{ opacity: 0.98, textShadow: '0 0 18px rgba(255,255,255,0.12)' }}>
                影
              </span>
              <span style={{ opacity: 0.98, textShadow: '0 0 18px rgba(255,255,255,0.12)' }}>
                与
              </span>
              <span style={{ opacity: 0.66 }}>我</span>
            </div>

            <div
              style={{
                fontSize: 18,
                letterSpacing: '0.18em',
                color: 'rgba(150,147,141,0.78)',
                display: 'flex',
              }}
            >
              haoye.cyou
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}