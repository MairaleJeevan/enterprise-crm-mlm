const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://enterprise-crm-mlm.vercel.app').replace(/\/+$/, '');

export function buildReferralLinks(referralCode: string) {
  const clientUrl = `${FRONTEND_URL}/login?ref=${referralCode}`;
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(clientUrl)}`;
  return { clientUrl, qrCode };
}
