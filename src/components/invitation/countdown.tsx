'use client';

import { useEffect, useState } from 'react';
import { EVENT_START } from '@/lib/domain/event';
import { getCountdownParts } from '@/lib/domain/countdown';

export function Countdown() {
  const [parts, setParts] = useState<ReturnType<typeof getCountdownParts> | null>(null);

  useEffect(() => {
    const update = () => setParts(getCountdownParts(new Date(), EVENT_START));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  if (parts?.complete) return <p className="countdown-complete">วันนี้แล้ว — แล้วเจอกันนะ!</p>;

  const units = parts
    ? [
        ['วัน', parts.days],
        ['ชั่วโมง', parts.hours],
        ['นาที', parts.minutes],
        ['วินาที', parts.seconds],
      ]
    : [
        ['วัน', '--'],
        ['ชั่วโมง', '--'],
        ['นาที', '--'],
        ['วินาที', '--'],
      ];

  return (
    <div className="countdown-grid" aria-label="เวลานับถอยหลังถึงวันงาน">
      {units.map(([label, value]) => (
        <div className="countdown-unit" key={label}>
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
