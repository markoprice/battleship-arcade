import type { Character } from '../types';

interface Props {
  character: Character;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function CharacterCard({ character, selected, onClick, compact }: Props) {
  const isSales = character.team === 'sales';
  const borderColor = isSales ? '#3969CA' : '#21C19A';
  const glowColor = isSales ? 'rgba(57, 105, 202, 0.6)' : 'rgba(33, 193, 154, 0.6)';
  const tintBg = isSales
    ? 'linear-gradient(135deg, #1a2a5e 0%, #2a3d7a 50%, #1a2a5e 100%)'
    : 'linear-gradient(135deg, #0a3d2e 0%, #1a5e4a 50%, #0a3d2e 100%)';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-105"
      style={{
        border: `2px solid ${selected ? '#FFD700' : borderColor}`,
        background: 'rgba(0,0,0,0.6)',
        padding: compact ? '8px' : '12px',
        boxShadow: selected
          ? `0 0 20px ${glowColor}, inset 0 0 20px rgba(255, 215, 0, 0.1)`
          : `0 0 10px ${glowColor}`,
        borderRadius: '4px',
        width: '100%',
      }}
    >
      {/* Portrait placeholder */}
      <div
        className="w-full aspect-square mb-2 flex items-center justify-center text-3xl"
        style={{
          background: tintBg,
          border: `2px solid ${borderColor}`,
          borderRadius: '2px',
          maxWidth: compact ? '80px' : '120px',
          maxHeight: compact ? '80px' : '120px',
        }}
      >
        <span style={{ filter: 'grayscale(20%)' }}>
          {isSales ? '🎯' : '💻'}
        </span>
      </div>

      {/* Name */}
      <div
        className="text-center mb-1 leading-tight"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#FFD700',
          fontSize: compact ? '7px' : '9px',
        }}
      >
        {character.name}
      </div>

      {/* Title */}
      <div
        className="text-center mb-1"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#aaa',
          fontSize: compact ? '5px' : '7px',
        }}
      >
        {character.title}
      </div>

      {/* Nickname */}
      <div
        className="text-center mb-2"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: isSales ? '#7B9FE8' : '#5DE8C5',
          fontSize: compact ? '5px' : '6px',
        }}
      >
        "{character.nickname}"
      </div>

      {/* Stats */}
      <div className="w-full space-y-1">
        {character.stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1">
            <span
              className="shrink-0 text-right"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#ccc',
                fontSize: compact ? '4px' : '5px',
                width: compact ? '50px' : '65px',
              }}
            >
              {stat.label}
            </span>
            <div
              className="flex-1 h-2 rounded-sm overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${stat.value}%`,
                  background: isSales
                    ? `linear-gradient(90deg, #3969CA, #9B59B6)`
                    : `linear-gradient(90deg, #21C19A, #2ECC71)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}
