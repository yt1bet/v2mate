import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — V2Mate',
  description: 'Get in touch with V2Mate support.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
          <a href="/" className="text-xl font-bold text-primary tracking-tight">
            V2<span className="text-gray-800">Mate</span>
          </a>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Have a question, found a bug, or want to report an issue? We&apos;d love to hear from you.
        </p>
        <div className="border border-orange-200 rounded-xl p-6 bg-orange-50">
          <p className="text-gray-700 text-sm leading-relaxed">
            📧 You can reach us at:{' '}
            <a href="mailto:support@v2mate.app" className="text-primary font-semibold hover:underline">
              support@v2mate.app
            </a>
          </p>
          <p className="text-gray-500 text-sm mt-3">
            We typically respond within 24–48 hours.
          </p>
        </div>
        <a href="/" className="mt-8 inline-block text-primary hover:underline text-sm">
          ← Back to Home
        </a>
      </div>
    </main>
  );
}
