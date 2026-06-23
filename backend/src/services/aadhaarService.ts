// Pluggable Aadhaar verification service.
// Real flow would use Setu's DigiLocker API to fetch a DigiLocker-issued Aadhaar
// e-KYC document via OAuth-like consent flow, never storing the raw Aadhaar number
// (DPDP Act compliance) - only a boolean verification_status.
//
// In mock mode (default), we simulate the DigiLocker consent screen: the user
// confirms their name + DOB match government records, and we auto-approve.

const MOCK_MODE = (process.env.MOCK_AADHAAR ?? 'true') !== 'false';

export interface AadhaarVerifyInput {
  fullName: string;
  dob: string; // YYYY-MM-DD
}

export interface AadhaarVerifyResult {
  approved: boolean;
  provider: 'mock-digilocker' | 'setu-digilocker';
  message: string;
}

export async function verifyAadhaar(input: AadhaarVerifyInput): Promise<AadhaarVerifyResult> {
  if (MOCK_MODE) {
    // Simulate DigiLocker consent + auto-approve. No Aadhaar number ever requested or stored.
    return {
      approved: true,
      provider: 'mock-digilocker',
      message: `Mock DigiLocker verification approved for ${input.fullName} (DOB confirmed). In production this calls Setu's DigiLocker API.`,
    };
  }

  const clientId = process.env.SETU_CLIENT_ID;
  const clientSecret = process.env.SETU_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn('[Aadhaar] MOCK_AADHAAR=false but Setu credentials missing; falling back to mock approval.');
    return { approved: true, provider: 'mock-digilocker', message: 'Fallback mock approval (Setu credentials not configured).' };
  }

  // Real Setu DigiLocker integration would be implemented here:
  // 1. Create a DigiLocker request via Setu API
  // 2. Redirect user to DigiLocker consent URL
  // 3. Poll/receive webhook for completion
  // 4. Fetch e-Aadhaar XML, extract name/DOB only, discard Aadhaar number
  throw new Error('Real Setu DigiLocker integration not implemented in this build. Set MOCK_AADHAAR=true for dev.');
}
