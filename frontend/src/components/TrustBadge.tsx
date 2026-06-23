interface Props {
  trustScore: number;
  phoneVerified?: boolean;
  aadhaarVerified?: boolean;
  selfieVerified?: boolean;
  size?: 'sm' | 'md';
}

export default function TrustBadge({ trustScore, phoneVerified, aadhaarVerified, selfieVerified, size = 'sm' }: Props) {
  const color = trustScore >= 70 ? 'bg-green-100 text-green-700' : trustScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex items-center gap-1 flex-wrap ${textSize}`}>
      <span className={`px-2 py-0.5 rounded-full font-semibold ${color}`}>Trust {trustScore}</span>
      {aadhaarVerified && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Aadhaar ✓</span>}
      {selfieVerified && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Selfie ✓</span>}
      {phoneVerified && !aadhaarVerified && !selfieVerified && (
        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Phone ✓</span>
      )}
    </div>
  );
}
