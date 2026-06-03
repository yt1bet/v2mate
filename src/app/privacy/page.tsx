import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — V2Mate',
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: January 2025</p>

        {[
          {
            title: 'What Data We Collect',
            body: 'V2Mate does not collect any personal information. We do not require registration, login, or any account creation. We do not store the URLs you submit.',
          },
          {
            title: 'Cookies',
            body: 'V2Mate does not use tracking cookies or analytics cookies. We may use essential session data for the service to function properly, but this is not stored long-term.',
          },
          {
            title: 'Third-Party Services',
            body: 'V2Mate uses third-party download infrastructure to process video requests. These services operate independently and may have their own privacy policies. We do not share any user data with these services.',
          },
          {
            title: 'Download Data',
            body: 'We do not store, log, or share the video URLs you submit or the files you download. All processing happens in real-time and nothing is retained on our servers.',
          },
          {
            title: 'Children\'s Privacy',
            body: 'V2Mate is not directed at children under 13. We do not knowingly collect data from children.',
          },
          {
            title: 'Changes to This Policy',
            body: 'We may update this Privacy Policy from time to time. Any changes will be reflected on this page.',
          },
          {
            title: 'Contact',
            body: 'If you have questions about this Privacy Policy, contact us at support@v2mate.app.',
          },
        ].map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="font-bold text-gray-800 mb-2">{section.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{section.body}</p>
          </div>
        ))}

        <a href="/" className="mt-4 inline-block text-primary hover:underline text-sm">
          ← Back to Home
        </a>
      </div>
    </main>
  );
}
