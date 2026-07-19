import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Fireflies Meeting Assistant',
  description: 'AI-powered SaaS meeting transcriber and assistant clone',
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}