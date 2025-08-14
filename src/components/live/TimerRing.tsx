import React from 'react';

export function TimerRing({ percent, time }: { percent: number; time: string }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg viewBox="0 0 150 150" className="w-40 h-40">
      <circle cx={75} cy={75} r={radius} stroke="#e5e5e5" strokeWidth={10} fill="none" />
      <circle
        cx={75}
        cy={75}
        r={radius}
        stroke="currentColor"
        strokeWidth={10}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-linear"
      />
      <text
        x="50%"
        y="50%"
        dy="0.3em"
        textAnchor="middle"
        className="text-xl font-bold"
      >
        {time}
      </text>
    </svg>
  );
}
