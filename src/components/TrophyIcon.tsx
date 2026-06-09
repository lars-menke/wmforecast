import trophyUrl from '../assets/trophy.png';

// Intrinsic dimensions after background-removal and crop
const TROPHY_W = 448;
const TROPHY_H = 1048;

type Props = {
  /** Height in px — width is auto-calculated from the image's aspect ratio */
  height?: number;
  className?: string;
};

export default function TrophyIcon({ height = 32, className }: Props) {
  const width = Math.round(height * (TROPHY_W / TROPHY_H));
  return (
    <img
      src={trophyUrl}
      width={width}
      height={height}
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
      style={{ objectFit: 'contain' }}
    />
  );
}
