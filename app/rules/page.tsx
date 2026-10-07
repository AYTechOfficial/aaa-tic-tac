'use client';

import Link from 'next/link';
import { Button, Card } from '@/components/ui';

const TRIVIA = [
  { q: 'What does AAA stand for?', a: 'American Automobile Association.' },
  { q: 'When should you use hazard lights?', a: 'During emergencies, low visibility, or when driving significantly below the speed limit.' },
  { q: 'How far behind a large truck should you drive?', a: 'At least 3 seconds under normal conditions, more in bad weather.' },
];

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--primary)] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold text-[var(--accent)]">Rules & Trivia</h1>
          <Link href="/">
            <Button variant="outline">Back to Arena</Button>
          </Link>
        </header>
        <section>
          <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">How to Play</h2>
          <ul className="list-disc pl-6 space-y-2 text-[var(--secondary)]">
            <li>Players take turns marking spaces in a 3×3 grid.</li>
            <li>The first player to secure 3 marks in a horizontal, vertical, or diagonal row wins.</li>
            <li>If all 9 spaces are filled and no winner is declared, the game is a draw.</li>
            <li><strong>Tow Trucks (X)</strong> always go first.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Roadside Safety Trivia</h2>
          <div className="space-y-4">
            {TRIVIA.map((item, i) => (
              <Card key={i} className="flex flex-col gap-2">
                <p className="font-medium text-[var(--primary)]">{item.q}</p>
                <p className="text-sm text-[var(--secondary)]">{item.a}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}