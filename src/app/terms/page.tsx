import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — V2Mate',
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: January 2025</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By using V2Mate, you agree to these Terms of Service. If you do not agree, please do not use this service.',
          },
          {
            title: '2. Use of the Service',
            body: 'V2Mate is intended for personal, non-commercial use only. You may only download videos that you have the legal right to download — such as your own content, content with open licenses, or content for which you have permission from the copyright holder.',
          },
          {
            title: '3. Copyright Compliance',
            body: 'Users are solely responsible for ensuring their downloads comply with applicable copyright laws. V2Mate does not endorse or facilitate copyright infringement. Downloading copyrighted content without permission from the rights holder is your responsibility.',
          },
          {
            title: '4. No Warranty',
            body: 'V2Mate is provided "as is" without any warranties. We do not guarantee uninterrupted or error-free service. Download availability depends on third-party services.',
          },
          {
            title: '5. Limitation of Liability',
            body: 'V2Mate is not liable for any damages arising from the use or inability to use this service. We are not responsible for any content downloaded through our platform.',
          },
          {
            title: '6. Changes to Terms',
            body: 'We may update these Terms at any time. Continued use of V2Mate after changes constitutes acceptance of the new terms.',
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
