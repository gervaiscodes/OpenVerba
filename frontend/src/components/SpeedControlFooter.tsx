import { useAudioSettings } from '../context/AudioSettingsContext';

export default function SpeedControlFooter() {
  const { playbackRate, setPlaybackRate } = useAudioSettings();
  const rates = [0.75, 1.0, 1.25, 1.5];

  return (
    <footer className="speed-control-footer">
      <span className="speed-control-label">Audio Speed:</span>
      <div className="speed-control-buttons">
        {rates.map(rate => (
          <button
            key={rate}
            onClick={() => setPlaybackRate(rate)}
            className={`speed-control-btn ${playbackRate === rate ? 'badge badge-alt' : 'badge'}`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </footer>
  );
}
