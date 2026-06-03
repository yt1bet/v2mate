import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'V2Mate — Free YouTube & Instagram Video Downloader',
  description:
    'Download YouTube videos, YouTube Shorts, and Instagram Reels for free. Choose MP4 in 360p, 480p, 720p, 1080p or download as MP3. Fast, free, no registration required.',
  keywords:
    'youtube downloader, instagram downloader, youtube to mp3, youtube to mp4, download youtube shorts, download reels, free video downloader, v2mate',
  openGraph: {
    title: 'V2Mate — Free YouTube & Instagram Video Downloader',
    description:
      'Download YouTube videos, Shorts, and Instagram Reels in MP4 or MP3. Free, fast, no signup needed.',
    type: 'website',
    url: 'https://v2mate.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'V2Mate — Free Video Downloader',
    description: 'Download YouTube & Instagram videos for free in MP4 or MP3.',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
