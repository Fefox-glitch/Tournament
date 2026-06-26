import { Team, TournamentMatch } from '../types';
import { MATCH_W, MATCH_H } from '../data/bracketLayout';

interface Props {
  match: TournamentMatch;
  x: number;
  y: number;
  teams: Record<string, Team>;
  format: 'Bo3' | 'Bo5';
  matchLabel?: string;
}

export default function BracketMatchCard({
  match, x, y, teams, format, matchLabel,
}: Props) {
  const team1 = match.team1_id ? teams[match.team1_id] : null;
  const team2 = match.team2_id ? teams[match.team2_id] : null;
  const isBo5 = format === 'Bo5';
  const isGrandFinal = match.id === 'M30';
  const slotH = MATCH_H / 2;

  const isWinner1 = match.winner_id === match.team1_id;
  const isWinner2 = match.winner_id === match.team2_id;

  const getBorderColor = () => {
    if (isGrandFinal) return '#f59e0b';
    if (isBo5) return '#d97706';
    if (match.status === 'completed') return '#22c55e';
    if (match.status === 'live') return '#eab308';
    return '#2a2a2a';
  };
  const borderColor = getBorderColor();

  const glowId = `glow-${match.id}`;

  const renderSlot = (
    team: Team | null,
    label: string,
    isTop: boolean,
    seed: number | null,
    score: number,
    isWinner: boolean,
  ) => {
    const slotY = isTop ? 0 : slotH;

    const getSlotFill = () => {
      if (!team) return '#0d0d0d';
      if (match.status === 'completed' && isWinner) return '#14532d';
      if (match.status === 'completed' && !isWinner) return '#450a0a';
      if (match.status === 'live') return '#292524';
      return '#1a1a1a';
    };

    const getTextColor = () => {
      if (!team) return '#374151';
      if (match.status === 'completed' && isWinner) return '#bbf7d0';
      if (match.status === 'completed' && !isWinner) return '#fca5a5';
      return '#d1d5db';
    };

    const getSeedColor = () => {
      if (!seed) return '#1e1e1e';
      if (match.status === 'completed' && isWinner) return '#166534';
      if (match.status === 'completed' && !isWinner) return '#7f1d1d';
      return '#1e1e1e';
    };

    return (
      <g key={isTop ? 'slot1' : 'slot2'} transform={`translate(0, ${slotY})`}>
        <rect x={0} y={0} width={MATCH_W} height={slotH} fill={getSlotFill()} />

        {/* Seed badge strip */}
        {seed !== null && (
          <rect x={0} y={0} width={22} height={slotH} fill={getSeedColor()} />
        )}
        {seed !== null && (
          <text x={11} y={slotH / 2 + 4} textAnchor="middle"
            fill={isWinner ? '#86efac' : '#555'} fontSize={9} fontWeight="700"
            fontFamily="Inter, sans-serif"
          >
            {seed}
          </text>
        )}

        {/* Team name */}
        <text
          x={seed !== null ? 28 : 8} y={slotH / 2 + 4}
          fill={getTextColor()}
          fontSize={team ? 10 : 9} fontWeight={team ? '600' : '400'}
          fontFamily="Inter, sans-serif" fontStyle={team ? 'normal' : 'italic'}
        >
          {team ? team.name : label}
        </text>

        {/* Score */}
        {team && (
          <text x={MATCH_W - 12} y={slotH / 2 + 4} textAnchor="middle"
            fill={match.status === 'completed' && isWinner ? '#bbf7d0' : match.status === 'completed' && !isWinner ? '#fca5a5' : '#fff'} fontSize={12} fontWeight="800"
            fontFamily="Inter, sans-serif"
          >
            {score}
          </text>
        )}

        {/* Slot divider */}
        {isTop && (
          <line x1={0} y1={slotH} x2={MATCH_W} y2={slotH}
            stroke={isBo5 ? '#3d2000' : '#222'} strokeWidth={1}
          />
        )}
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Glow filter */}
      {(isBo5 || match.status === 'live' || match.status === 'completed') && (
        <defs>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={isGrandFinal ? 4 : 2} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      )}

      {/* Special match title above card */}
      {matchLabel && (
        <text
          x={MATCH_W / 2} y={-12}
          textAnchor="middle"
          fill={isGrandFinal ? '#fbbf24' : '#d97706'}
          fontSize={8} fontWeight="800" letterSpacing={2}
          fontFamily="Inter, sans-serif"
        >
          {matchLabel}
        </text>
      )}

      {/* Match ID badge */}
      <rect x={-30} y={MATCH_H / 2 - 10} width={26} height={20} rx={3}
        fill={isGrandFinal ? '#b45309' : isBo5 ? '#92400e' : '#7f1d1d'}
      />
      <text x={-17} y={MATCH_H / 2 + 4} textAnchor="middle"
        fill={isBo5 ? '#fde68a' : '#fca5a5'} fontSize={7} fontWeight="800"
        fontFamily="Inter, sans-serif"
      >
        {match.id}
      </text>

      {/* Bo3/Bo5 format pill — sits just below match ID badge */}
      <rect x={-30} y={MATCH_H / 2 + 12} width={26} height={12} rx={3}
        fill={isBo5 ? '#d97706' : '#292929'}
      />
      <text x={-17} y={MATCH_H / 2 + 21} textAnchor="middle"
        fill={isBo5 ? '#000' : '#666'} fontSize={7} fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {format}
      </text>

      {/* Status indicator */}
      <g transform="translate(-30, -10)">
        {match.status === 'live' && (
          <circle r={3} fill="#22c55e">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
        {match.status === 'completed' && <circle r={3} fill="#22c55e" />}
        {match.status === 'upcoming' && <circle r={3} fill="#666" />}
      </g>

      {/* Card border */}
      <rect x={0} y={0} width={MATCH_W} height={MATCH_H} rx={4}
        fill="none" stroke={borderColor}
        strokeWidth={isBo5 ? 2 : 1}
        filter={(isBo5 || match.status === 'live' || match.status === 'completed') ? `url(#${glowId})` : undefined}
      />

      {renderSlot(team1, match.team1_label, true, match.team1_seed, match.score_team1, isWinner1)}
      {renderSlot(team2, match.team2_label, false, match.team2_seed, match.score_team2, isWinner2)}
    </g>
  );
}
