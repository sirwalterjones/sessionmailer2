import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '32px',
          position: 'relative',
        }}
      >
        {/* Email lines */}
        <div
          style={{
            position: 'absolute',
            top: '45px',
            left: '35px',
            right: '35px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '110px',
              height: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
            }}
          />
          <div
            style={{
              width: '110px',
              height: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
            }}
          />
          <div
            style={{
              width: '80px',
              height: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
            }}
          />
        </div>
        {/* Camera dot */}
        <div
          style={{
            position: 'absolute',
            bottom: '35px',
            right: '35px',
            width: '24px',
            height: '24px',
            backgroundColor: 'white',
            borderRadius: '50%',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
} 