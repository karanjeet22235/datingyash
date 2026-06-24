export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-700 space-y-4">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p>Last updated: 2026. DateInIndia ("we", "us") is committed to protecting your privacy in compliance with India's Digital Personal Data Protection Act (DPDP), 2023.</p>

      <h2 className="text-xl font-bold mt-6">What we collect</h2>
      <p>Phone number, profile information you provide (name, photos, bio, interests), and verification status flags. We do <strong>not</strong> store your actual Aadhaar number — only a boolean verification status after a successful DigiLocker-based check.</p>

      <h2 className="text-xl font-bold mt-6">How we use your data</h2>
      <p>To operate matching, chat, and safety features. Chat messages are automatically scanned by our safety system to detect scam patterns and protect users — this scanning is automated and not reviewed by humans unless you file a report.</p>

      <h2 className="text-xl font-bold mt-6">Your rights</h2>
      <p>You may access, correct, or delete your personal data at any time. Deleting your account permanently and irreversibly removes your profile, photos, matches, messages, and all associated data from our systems.</p>

      <h2 className="text-xl font-bold mt-6">Data sharing</h2>
      <p>We do not sell your personal data. Verification checks may involve trusted third-party providers (DigiLocker/Setu for Aadhaar, HyperVerge for selfie liveness) strictly to confirm identity claims.</p>

      <h2 className="text-xl font-bold mt-6">Contact</h2>
      <p>For privacy requests, contact privacy@dateinindia.example (placeholder contact for this demo build).</p>
    </div>
  );
}
