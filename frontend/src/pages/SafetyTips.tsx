export default function SafetyTips() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 prose">
      <h1 className="text-3xl font-bold mb-6">Safety Tips</h1>
      <div className="space-y-5 text-gray-700">
        <Tip title="Never send money or share financial details" body="Genuine matches will never ask you for money, gift cards, cryptocurrency, or your UPI/bank details. If someone does, report and block them immediately." />
        <Tip title="Keep conversations on the platform initially" body="Scammers often try to move conversations to WhatsApp or Telegram quickly to avoid detection. Stay on DateInIndia chat until you're comfortable — our 7-day new-match protection blocks phone/UPI sharing automatically." />
        <Tip title="Meet in public places" body="For your first few meetings, choose public places, tell a friend where you're going, and arrange your own transport." />
        <Tip title="Verify before you trust" body="Look for the Aadhaar and Selfie verification badges on profiles. While not foolproof, verified profiles add an extra layer of accountability." />
        <Tip title="Watch for too-good-to-be-true investment tips" body="Be wary of matches who bring up cryptocurrency, trading, or guaranteed-return investment schemes early in conversation — this is a very common scam pattern." />
        <Tip title="Trust your instincts" body="If something feels off, it probably is. Report suspicious behavior — our team reviews every report." />
      </div>
    </div>
  );
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm">{body}</p>
    </div>
  );
}
