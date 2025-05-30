import React from "react";

interface HivelensIconProps extends React.SVGProps<SVGSVGElement> {}

const HivelensIcon: React.FC<HivelensIconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="790.0 -2250 1440 816.7"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <g
        transform="scale(1, -1)"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={40}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1282 2343 c-26 -12 -43 -35 -73 -95 l-39 -78 -45 0 c-38 0 -45 3 -45 19 0 47 -8 51 -96 51 -72 0 -85 -3 -94 -19 -5 -11 -8 -26 -5 -33 3 -8 -11 -20 -41 -32 -31 -13 -54 -31 -72 -59 l-27 -40 -3 -321 c-2 -177 0 -340 3 -364 7 -50 53 -108 102 -128 26 -11 155 -14 656 -14 l624 0 43 23 c30 16 51 37 67 67 l24 45 -3 351 -3 351 -28 36 c-44 58 -57 62 -232 67 l-159 5 -41 74 c-60 109 -67 111 -295 111 -151 0 -191 -3 -218 -17z m409 -75 c6 -7 27 -44 47 -83 22 -41 47 -75 62 -82 17 -9 76 -13 178 -13 149 0 154 -1 177 -25 l25 -24 0 -339 0 -339 -25 -27 -24 -26 -630 0 -629 0 -26 31 -26 31 0 324 c0 341 4 372 45 388 9 3 85 6 169 6 178 0 181 2 227 93 52 103 37 97 240 97 130 0 181 -3 190 -12z m-641 -90 c35 -42 27 -48 -65 -48 -61 0 -85 3 -85 13 1 16 31 53 50 60 28 12 81 -2 100 -25z" />
        <path d="M1350 2050 c-122 -42 -245 -136 -343 -262 l-59 -77 45 -64 c25 -35 80 -96 122 -135 244 -228 532 -225 778 8 46 44 101 104 122 134 l37 54 -32 47 c-90 131 -233 247 -358 291 -87 31 -230 33 -312 4z m246 -64 c90 -24 174 -76 260 -161 118 -118 117 -108 28 -203 -89 -96 -173 -155 -261 -182 -178 -55 -344 5 -507 182 -88 96 -89 86 23 198 149 150 306 206 457 166z" />
        <path d="M1445 1929 c-56 -14 -112 -55 -141 -105 -115 -196 100 -420 304 -315 94 48 140 163 109 275 l-8 29 -19 -31 c-36 -59 -86 -68 -131 -23 -47 47 -32 108 34 136 l30 12 -34 11 c-55 18 -101 21 -144 11z m57 -95 c-4 -58 -2 -63 32 -99 35 -36 37 -37 92 -33 68 6 73 -2 44 -70 -42 -98 -148 -137 -248 -92 -156 71 -148 285 13 344 65 24 70 19 67 -50z" />
      </g>
    </svg>
  );
};

export default HivelensIcon;
