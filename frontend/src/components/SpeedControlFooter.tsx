import { useAudioSettings } from '../context/AudioSettingsContext';

export default function SpeedControlFooter() {
  const { playbackRate, setPlaybackRate } = useAudioSettings();
  const rates = [0.75, 1.0, 1.25, 1.5];

  return (
    <footer style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#0a0a0a',
      borderTop: '1px solid #27272a',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 100
    }}>
      <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Audio Speed:</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {rates.map(rate => (
          <button
            key={rate}
            onClick={() => setPlaybackRate(rate)}
            className={playbackRate === rate ? 'badge badge-alt' : 'badge'}
            style={{
              cursor: 'pointer',
              border: 'none',
              minWidth: '3rem',
              textAlign: 'center'
            }}
          >
            {rate}x
          </button>
        ))}
      </div>
    </footer>
  );
}
