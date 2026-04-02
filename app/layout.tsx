import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Workout Tracker',
  description: 'Custom push/pull workout tracker with rest timers.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
