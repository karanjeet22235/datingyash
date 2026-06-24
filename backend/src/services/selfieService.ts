// Pluggable selfie liveness verification service.
// Real flow would use HyperVerge's selfie liveness + face-match API.
// In mock mode (default), any uploaded selfie image is auto-approved.

const MOCK_MODE = (process.env.MOCK_SELFIE ?? 'true') !== 'false';

export interface SelfieVerifyResult {
  approved: boolean;
  provider: 'mock-hyperverge' | 'hyperverge';
  message: string;
}

export async function verifySelfie(filePath: string): Promise<SelfieVerifyResult> {
  if (MOCK_MODE) {
    return {
      approved: true,
      provider: 'mock-hyperverge',
      message: 'Mock liveness check passed (auto-approved in dev mode). In production this calls HyperVerge selfie liveness + face match API.',
    };
  }

  const appId = process.env.HYPERVERGE_APP_ID;
  const appKey = process.env.HYPERVERGE_APP_KEY;
  if (!appId || !appKey) {
    console.warn('[Selfie] MOCK_SELFIE=false but HyperVerge credentials missing; falling back to mock approval.');
    return { approved: true, provider: 'mock-hyperverge', message: 'Fallback mock approval (HyperVerge credentials not configured).' };
  }

  // Real HyperVerge integration would upload filePath and call their liveness API here.
  throw new Error('Real HyperVerge integration not implemented in this build. Set MOCK_SELFIE=true for dev.');
}
