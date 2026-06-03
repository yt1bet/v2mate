import Downloader from '@/components/Downloader';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    desc: 'Download starts in 3–10 seconds. No waiting, no queue.',
  },
  {
    icon: '🎬',
    title: 'Multiple Formats',
    desc: 'Choose from MP3 audio or MP4 video in 360p up to 1440p.',
  },
  {
    icon: '📱',
    title: 'YouTube Shorts',
    desc: 'Supports all YouTube Shorts. Just paste the link and go.',
  },
  {
    icon: '📸',
    title: 'Instagram Reels',
    desc: 'Download Instagram Reels instantly in full quality.',
  },
  {
    icon: '🔒',
    title: 'Safe & Private',
    desc: 'We never store your data or downloaded videos. 100% private.',
  },
  {
    icon: '💸',
    title: 'Completely Free',
    desc: 'No signup, no subscription, no hidden fees. Always free.',
  },
];

const FAQS = [
  {
    q: 'How do I download a YouTube video?',
    a: 'Simply copy the YouTube video URL from your browser, paste it into the search box above, and click "Start →". Then choose your preferred format and quality — the download will begin automatically.',
  },
  {
    q: 'Can I download YouTube Shorts?',
    a: 'Yes! V2Mate fully supports YouTube Shorts. Just copy the Shorts URL (it looks like youtube.com/shorts/...) and paste it into the box above.',
  },
  {
    q: 'How do I download Instagram Reels?',
    a: 'Open the Instagram Reel on your phone or PC, tap the three-dot menu, copy the link, then paste it into V2Mate above and click Start.',
  },
  {
    q: 'Is V2Mate free to use?',
    a: 'Yes, completely free. No account needed, no payment, no daily limits. Just paste and download.',
  },
  {
    q: 'What formats can I download?',
    a: 'You can download MP3 (audio only) or MP4 video in 360p, 480p, 720p, 1080p, or 1440p quality depending on what the original video supports.',
  },
  {
    q: 'Is it safe to use V2Mate?',
    a: 'Yes. V2Mate does not store your video links, does not save any videos, and does not collect personal data. Your downloads go directly to your device.',
  },
  {
    q: 'Why can\'t I download some videos?',
    a: 'Some videos may be age-restricted, private, or region-locked, which prevents downloading. Try another video if one does not work.',
  },
  {
    q: 'Does V2Mate work on mobile?',
    a: 'Yes! V2Mate is fully mobile-friendly. It works on iPhone, Android, and any browser including Chrome, Safari, and Firefox.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-primary tracking-tight">
            V2<span className="text-gray-800">Mate</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-14 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
            YouTube & Instagram{' '}
            <span className="text-primary">Video Downloader</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Download any YouTube video, Short, or Instagram Reel — free, fast, and in the quality you want.
          </p>

          <Downloader />

          <p className="text-xs text-gray-400 mt-5">
            Supports: YouTube • YouTube Shorts • Instagram Reels
          </p>
        </div>
      </section>

      {/* Supported Platforms Banner */}
      <section className="py-6 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">▶</span>
              YouTube
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">▶</span>
              YouTube Shorts
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">📸</span>
              Instagram Reels
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            Why Choose <span className="text-primary">V2Mate</span>?
          </h2>
          <p className="text-center text-gray-400 mb-10 text-sm">Everything you need to download videos — nothing you don&apos;t.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-xl p-6 hover:border-orange-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-4 bg-orange-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Copy the URL', desc: 'Copy the link of any YouTube video or Instagram Reel from your browser.' },
              { step: '2', title: 'Paste & Click Start', desc: 'Paste the URL into V2Mate and press the Start button.' },
              { step: '3', title: 'Download!', desc: 'Choose your format and quality. The download begins instantly.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-400 mb-10 text-sm">Everything you need to know about V2Mate.</p>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xl font-bold text-white mb-1">
                V2<span className="text-primary">Mate</span>
              </p>
              <p className="text-sm">Free video downloader for YouTube & Instagram.</p>
            </div>
            <nav className="flex gap-6 text-sm">
              <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
              <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            </nav>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-xs text-gray-600">
            <p>© {new Date().getFullYear()} V2Mate. This tool is intended for downloading videos you have rights to download. Please respect copyright laws.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
