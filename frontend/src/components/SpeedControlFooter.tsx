import { useAudioSettings } from '../context/AudioSettingsContext';

export default function SpeedControlFooter() {
  const { playbackRate, setPlaybackRate } = useAudioSettings();
  const rates = [0.75, 1.0, 1.25, 1.5];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-zinc-800 p-2 sm:p-4 flex justify-center items-center gap-2 sm:gap-4 z-[100]">
      <span className="text-zinc-400 text-sm whitespace-nowrap">Audio Speed:</span>
      <div className="flex gap-1 sm:gap-2">
        {rates.map(rate => (
          <button
            key={rate}
            onClick={() => setPlaybackRate(rate)}
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide cursor-pointer min-w-10 sm:min-w-12 text-center ${
              playbackRate === rate
                ? 'bg-zinc-800 border border-zinc-700 text-white'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </footer>
  );
}
