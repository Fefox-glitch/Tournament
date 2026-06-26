import { Team, TournamentMatch8 } from '../types';
import {
  POSITIONS8, CANVAS_W8, CANVAS_H8, SECTION_BANDS8,
  buildConnectors8, MATCH_H8, getFormat8, MATCH_LABELS8,
} from '../data/bracketLayout8';
import BracketMatchCard8 from './BracketMatchCard8';

interface Props {
  matches: Record<string, TournamentMatch8>;
  teams: Record<string, Team>;
}

const LABEL_W = 40;
const PAD = 32;

export default function BracketVis8({ matches, teams }: Props) {
  const connectors = buildConnectors8();
  const totalW = LABEL_W + PAD + CANVAS_W8 + 80;
  const totalH = CANVAS_H8 + PAD * 2;

  const finalMatch = matches['M16'];
  const champion = finalMatch?.winner_id ? teams[finalMatch.winner_id] : null;

  return (
    <div className="w-full overflow-x-auto pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mb-4 px-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>Ganador</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span>Eliminado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
          <span>En Vivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-[#292929] flex items-center justify-center">
            <span className="text-[9px] text-gray-500 font-bold">Bo3</span>
          </div>
          <span>Mejor de 3</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-amber-700 flex items-center justify-center">
            <span className="text-[9px] text-black font-bold">Bo5</span>
          </div>
          <span>Gran Final</span>
        </div>
      </div>

      <svg
        width={totalW}
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="select-none"
        style={{ minWidth: totalW }}
      >
        <rect width={totalW} height={totalH} fill="#050505" rx={8} />

        {/* Section bands */}
        {SECTION_BANDS8.map((band) => (
          <rect
            key={band.label}
            x={0}
            y={band.y1 + PAD}
            width={totalW}
            height={band.y2 - band.y1}
            fill={
              band.label === 'UPPER BRACKET'
                ? 'rgba(185,28,28,0.05)'
                : 'rgba(185,28,28,0.04)'
            }
          />
        ))}

        {/* Divider line */}
        <line
          x1={0} y1={SECTION_BANDS8[0].y2 + PAD}
          x2={totalW} y2={SECTION_BANDS8[0].y2 + PAD}
          stroke="#1f1f1f" strokeWidth={1}
        />

        {/* Section labels */}
        {SECTION_BANDS8.map((band) => {
          const midY = (band.y1 + band.y2) / 2 + PAD;
          const color = band.label === 'UPPER BRACKET' ? '#ef4444' : '#f97316';
          return (
            <g key={`lbl-${band.label}`}>
              <line
                x1={LABEL_W / 2} y1={band.y1 + PAD + 12}
                x2={LABEL_W / 2} y2={band.y2 + PAD - 12}
                stroke={color} strokeWidth={2} strokeOpacity={0.35}
              />
              <text
                x={LABEL_W / 2} y={midY}
                textAnchor="middle" dominantBaseline="middle"
                fill={color} fontSize={8} fontWeight="800" letterSpacing={2}
                fontFamily="Inter, sans-serif"
                transform={`rotate(-90, ${LABEL_W / 2}, ${midY})`}
              >
                {band.label}
              </text>
            </g>
          );
        })}

        {/* Bracket content */}
        <g transform={`translate(${LABEL_W + PAD}, ${PAD})`}>

          {/* Connector lines */}
          {connectors.map((seg, i) => (
            <line
              key={i}
              x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
              stroke={seg.dashed ? '#2a1010' : '#4a1515'}
              strokeWidth={seg.dashed ? 1 : 1.5}
              strokeDasharray={seg.dashed ? '4 3' : undefined}
              strokeOpacity={seg.dashed ? 0.8 : 1}
            />
          ))}

          {/* Match cards */}
          {Object.entries(POSITIONS8).map(([id, [x, y]]) => {
            const match = matches[id];
            if (!match) return null;
            const fmt = getFormat8(id);
            const lbl = MATCH_LABELS8[id];
            return (
              <BracketMatchCard8
                key={id}
                match={match}
                x={x}
                y={y}
                teams={teams}
                format={fmt}
                matchLabel={lbl}
              />
            );
          })}

          {/* Champion icon */}
          {(() => {
            const [m16x, m16y] = POSITIONS8['M16'];
            const tx = m16x + 160 + 44;
            const ty = m16y + MATCH_H8 / 2;
            return (
              <g transform={`translate(${tx}, ${ty})`}>
                <circle r={26} fill={champion ? '#14532d' : '#1c0f00'} stroke="#f59e0b" strokeWidth={1.5} />
                <text textAnchor="middle" dominantBaseline="middle" fontSize={20}>{'🏆'}</text>
                <text y={38} textAnchor="middle" fill="#f59e0b"
                  fontSize={7} fontWeight="800" letterSpacing={1.5}
                  fontFamily="Inter, sans-serif"
                >
                  CAMPEÓN
                </text>
                {champion && (
                  <text y={-20} textAnchor="middle" fill="#bbf7d0"
                    fontSize={9} fontWeight="700"
                    fontFamily="Inter, sans-serif"
                  >
                    {champion.name}
                  </text>
                )}
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
}
