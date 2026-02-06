import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? '';

let initialized = false;

function initEmailJS() {
  if (initialized) return true;
  if (!PUBLIC_KEY) {
    console.warn('[emailService] VITE_EMAILJS_PUBLIC_KEY is not set. Skip sending welcome email.');
    return false;
  }
  try {
    emailjs.init({ publicKey: PUBLIC_KEY });
    initialized = true;
    return true;
  } catch (err) {
    console.error('[emailService] EmailJS init failed:', err);
    return false;
  }
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  password: string;
  company_name?: string;
}

/**
 * Sends a welcome email with login credentials (e.g. after auto-creating a user from a worker).
 */
export async function sendWelcomeEmail(userData: WelcomeEmailData): Promise<void> {
  if (!initEmailJS() || !SERVICE_ID || !TEMPLATE_ID) {
    console.warn('[emailService] EmailJS not configured. Check .env (VITE_EMAILJS_*).');
    return;
  }
  const templateParams = {
    to_name: userData.name,
    to_email: userData.email,
    temp_password: userData.password,
    login_link: typeof window !== 'undefined' ? window.location.origin + '/login' : '/login',
    company_name: userData.company_name ?? 'Özartek İBYS',
  };
  console.log('DEBUG: Service ID exists?', !!import.meta.env.VITE_EMAILJS_SERVICE_ID);
  console.log('DEBUG: Template ID exists?', !!import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
  console.log('DEBUG: Public Key exists?', !!import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  console.log('DEBUG: templateParams:', templateParams);
  try {
    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log('[emailService] Welcome email sent successfully.', res.status, res.text);
  } catch (err) {
    console.error('EMAILJS ERROR:', err);
    throw err;
  }
}
