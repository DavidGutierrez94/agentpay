"use client";

interface CloverLogoProps {
  size?: number;
  className?: string;
}

/**
 * 8-bit pixel art four-leaf clover.
 * Each "pixel" is a 1x1 rect on a 16x16 grid.
 */
export function CloverLogo({ size = 24, className = "" }: CloverLogoProps) {
  // 16x16 pixel grid — 1 = filled pixel, 0 = empty
  // Draws a four-leaf clover with a small stem
  const pixels = [
    // row 0
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    // row 1
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    // row 2
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
    // row 3
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    // row 4
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    // row 5
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    // row 6
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    // row 7 — center pinch
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    // row 8
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    // row 9
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    // row 10
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    // row 11
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    // row 12
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
    // row 13
    [0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0],
    // row 14 — stem
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    // row 15 — stem
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="crispEdges"
    >
      {pixels.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}
