import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: '6px',
          position: 'relative',
        }}
      >
        {/* Email lines */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '6px',
            right: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '2px',
              backgroundColor: 'white',
            }}
          />
          <div
            style={{
              width: '20px',
              height: '2px',
              backgroundColor: 'white',
            }}
          />
          <div
            style={{
              width: '14px',
              height: '2px',
              backgroundColor: 'white',
            }}
          />
        </div>
        {/* Camera dot */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            width: '6px',
            height: '6px',
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