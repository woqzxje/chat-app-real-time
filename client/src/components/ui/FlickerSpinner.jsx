import React from 'react';

export default function FlickerSpinner({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 42 42"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      className="shrink-0"
      style={{ '--on': '#00cfff', '--off': '#2a2a2a', '--dur': '1.350s', minWidth: size, minHeight: size }}
    >
      <title>Loading</title>
      <style>{`
        circle { fill: var(--off); opacity: 0.2; }
        circle.on { fill: var(--on); filter: drop-shadow(0 0 3px var(--on)); }
        @media (prefers-reduced-motion: reduce) { circle { animation: none !important; } }
        @keyframes f011111000 { 0% { opacity: 0; } 11.10% { opacity: 0; } 11.11% { opacity: 1; } 66.66% { opacity: 1; } 66.67% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f001111000 { 0% { opacity: 0; } 22.21% { opacity: 0; } 22.22% { opacity: 1; } 66.66% { opacity: 1; } 66.67% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f001111100 { 0% { opacity: 0; } 22.21% { opacity: 0; } 22.22% { opacity: 1; } 77.77% { opacity: 1; } 77.78% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f000111000 { 0% { opacity: 0; } 33.32% { opacity: 0; } 33.33% { opacity: 1; } 66.66% { opacity: 1; } 66.67% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f000111100 { 0% { opacity: 0; } 33.32% { opacity: 0; } 33.33% { opacity: 1; } 77.77% { opacity: 1; } 77.78% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f000111110 { 0% { opacity: 0; } 33.32% { opacity: 0; } 33.33% { opacity: 1; } 88.88% { opacity: 1; } 88.89% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f000011000 { 0% { opacity: 0; } 44.43% { opacity: 0; } 44.44% { opacity: 1; } 66.66% { opacity: 1; } 66.67% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f000011100 { 0% { opacity: 0; } 44.43% { opacity: 0; } 44.44% { opacity: 1; } 77.77% { opacity: 1; } 77.78% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes f000001000 { 0% { opacity: 0; } 55.55% { opacity: 0; } 55.56% { opacity: 1; } 66.66% { opacity: 1; } 66.67% { opacity: 0; } 100% { opacity: 0; } }
      `}</style>
      <circle cx="3" cy="3" r="2" />
      <circle cx="9" cy="3" r="2" />
      <circle cx="15" cy="3" r="2" />
      <circle cx="21" cy="3" r="2" />
      <circle cx="27" cy="3" r="2" />
      <circle cx="33" cy="3" r="2" />
      <circle cx="39" cy="3" r="2" />
      <circle cx="3" cy="9" r="2" />
      <circle cx="9" cy="9" r="2" />
      <circle cx="15" cy="9" r="2" />
      <circle className="on" cx="15" cy="9" r="2" opacity={0} style={{ animation: 'f011111000 var(--dur) linear infinite' }} />
      <circle cx="21" cy="9" r="2" />
      <circle cx="27" cy="9" r="2" />
      <circle className="on" cx="27" cy="9" r="2" opacity={0} style={{ animation: 'f011111000 var(--dur) linear infinite' }} />
      <circle cx="33" cy="9" r="2" />
      <circle cx="39" cy="9" r="2" />
      <circle cx="3" cy="15" r="2" />
      <circle cx="9" cy="15" r="2" />
      <circle className="on" cx="9" cy="15" r="2" opacity={0} style={{ animation: 'f001111000 var(--dur) linear infinite' }} />
      <circle cx="15" cy="15" r="2" />
      <circle className="on" cx="15" cy="15" r="2" opacity={0} style={{ animation: 'f001111000 var(--dur) linear infinite' }} />
      <circle cx="21" cy="15" r="2" />
      <circle className="on" cx="21" cy="15" r="2" opacity={0} style={{ animation: 'f001111100 var(--dur) linear infinite' }} />
      <circle cx="27" cy="15" r="2" />
      <circle className="on" cx="27" cy="15" r="2" opacity={0} style={{ animation: 'f001111000 var(--dur) linear infinite' }} />
      <circle cx="33" cy="15" r="2" />
      <circle className="on" cx="33" cy="15" r="2" opacity={0} style={{ animation: 'f001111000 var(--dur) linear infinite' }} />
      <circle cx="39" cy="15" r="2" />
      <circle cx="3" cy="21" r="2" />
      <circle cx="9" cy="21" r="2" />
      <circle className="on" cx="9" cy="21" r="2" opacity={0} style={{ animation: 'f000111000 var(--dur) linear infinite' }} />
      <circle cx="15" cy="21" r="2" />
      <circle className="on" cx="15" cy="21" r="2" opacity={0} style={{ animation: 'f000111100 var(--dur) linear infinite' }} />
      <circle cx="21" cy="21" r="2" />
      <circle className="on" cx="21" cy="21" r="2" opacity={0} style={{ animation: 'f000111110 var(--dur) linear infinite' }} />
      <circle cx="27" cy="21" r="2" />
      <circle className="on" cx="27" cy="21" r="2" opacity={0} style={{ animation: 'f000111100 var(--dur) linear infinite' }} />
      <circle cx="33" cy="21" r="2" />
      <circle className="on" cx="33" cy="21" r="2" opacity={0} style={{ animation: 'f000111000 var(--dur) linear infinite' }} />
      <circle cx="39" cy="21" r="2" />
      <circle cx="3" cy="27" r="2" />
      <circle cx="9" cy="27" r="2" />
      <circle cx="15" cy="27" r="2" />
      <circle className="on" cx="15" cy="27" r="2" opacity={0} style={{ animation: 'f000011000 var(--dur) linear infinite' }} />
      <circle cx="21" cy="27" r="2" />
      <circle className="on" cx="21" cy="27" r="2" opacity={0} style={{ animation: 'f000011100 var(--dur) linear infinite' }} />
      <circle cx="27" cy="27" r="2" />
      <circle className="on" cx="27" cy="27" r="2" opacity={0} style={{ animation: 'f000011000 var(--dur) linear infinite' }} />
      <circle cx="33" cy="27" r="2" />
      <circle cx="39" cy="27" r="2" />
      <circle cx="3" cy="33" r="2" />
      <circle cx="9" cy="33" r="2" />
      <circle cx="15" cy="33" r="2" />
      <circle cx="21" cy="33" r="2" />
      <circle className="on" cx="21" cy="33" r="2" opacity={0} style={{ animation: 'f000001000 var(--dur) linear infinite' }} />
      <circle cx="27" cy="33" r="2" />
      <circle cx="33" cy="33" r="2" />
      <circle cx="39" cy="33" r="2" />
      <circle cx="3" cy="39" r="2" />
      <circle cx="9" cy="39" r="2" />
      <circle cx="15" cy="39" r="2" />
      <circle cx="21" cy="39" r="2" />
      <circle cx="27" cy="39" r="2" />
      <circle cx="33" cy="39" r="2" />
      <circle cx="39" cy="39" r="2" />
    </svg>
  );
}
