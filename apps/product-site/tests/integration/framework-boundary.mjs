export const effects = { sessions: [], emails: [], checkouts: [] };
export function redirect(path) { throw Object.assign(new Error('Framework redirect'), { redirectTo: path }); }
export function unstable_rethrow(error) { if (error.redirectTo) throw error; }
export const headers = async () => new Headers({ 'x-forwarded-for': '127.0.0.1', 'user-agent': 'integration-test' });
export async function writeCommercialAccountSessionFromAccount(value) { effects.sessions.push(value); }
export async function clearCommercialAccountSession() { effects.sessions.length = 0; }
export async function sendCommercialAccountVerificationEmail(value) { effects.emails.push(value); return { status: 'sent' }; }
export async function createStripeCheckoutForPackageChange(value) { effects.checkouts.push(value); return { url: 'https://checkout.example.test/not-a-real-session' }; }
export const resolveStripePriceSelection = () => ({ priceId: 'price_test_fixture', currency: 'GBP' });
export const assertStripePriceMatchesSelection = async () => {};
