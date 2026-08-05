'use client';

import { useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';

const BACKGROUNDS = [
  { id: 'none', label: 'None', value: null },
  { id: 'blur', label: 'Blur', value: 'blur' },
  { id: 'office', label: 'Office', value: '/backgrounds/office.jpg' },
  { id: 'nature', label: 'Nature', value: '/backgrounds/nature.jpg' },
  { id: 'space', label: 'Space', value: '/backgrounds/space.jpg' },
  { id: 'abstract', label: 'Abstract', value: '/backgrounds/abstract.jpg' },
];

export function VirtualBackgroundSelector({
  onSelect,
}: {
  onSelect: (bg: string | null) => void;
}) {
  const [selected, setSelected] = useState<string>('none');
  const [showPanel, setShowPanel] = useState(false);

  const handleSelect = (id: string, value: string | null) => {
    setSelected(id);
    onSelect(value);
    setShowPanel(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Virtual Background"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {showPanel && (
        <div className="absolute bottom-12 right-0 bg-gray-800 rounded-lg p-3 shadow-xl border border-gray-700 z-50 w-64">
          <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Virtual Background
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleSelect(bg.id, bg.value)}
                className={`aspect-video rounded-lg border-2 flex items-center justify-center text-xs transition-all ${
                  selected === bg.id
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <span className="text-gray-300">{bg.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: Blur requires TensorFlow.js body segmentation (loaded on demand).
          </p>
        </div>
      )}
    </div>
  );
}

export function NoiseSuppressionToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
        enabled
          ? 'bg-green-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      title="Noise suppression"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12h2m16 0h2M6 8l1.5 1.5M16.5 16.5 18 18M6 16l1.5-1.5M16.5 7.5 18 6M12 2v2m0 16v2" />
        <circle cx="12" cy="12" r="4" />
      </svg>
      {enabled ? 'Noise Off' : 'Noise On'}
    </button>
  );
}
