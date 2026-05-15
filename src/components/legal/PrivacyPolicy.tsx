import React, { useEffect } from 'react';
import { useLocalization } from '@/hooks/useLocalization';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">{title}</h2>
    <div className="text-neutral-700 dark:text-neutral-300 space-y-3 leading-relaxed">{children}</div>
  </section>
);

const PrivacyPolicy: React.FC = () => {
  const { t } = useLocalization();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
    if (root) root.style.overflow = 'auto';
    return () => { html.style.overflow = ''; body.style.overflow = ''; if (root) root.style.overflow = ''; };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 sm:p-10">
        <header className="mb-10 border-b border-neutral-200 dark:border-neutral-700 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: May 2026
          </p>
          <p className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
            BHBlasted S.r.l. ("we", "us", "our"), a company incorporated under the laws of Italy,
            operates IT Hub Center (the "Service"). This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our Service, in compliance with the
            General Data Protection Regulation (GDPR - EU Regulation 2016/679) and applicable Italian
            data protection legislation (Legislative Decree 196/2003, as amended by Legislative Decree 101/2018).
          </p>
        </header>

        <Section title="1. Data Controller">
          <p>
            The data controller is <strong>BHBlasted S.r.l.</strong>, with registered office in Italy.
            For any questions regarding the processing of your personal data, you may contact us at:{' '}
            <a href="mailto:privacy@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              privacy@ithubcenter.com
            </a>.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Account Information:</strong> Full name, email address, profile picture,
              organization name, and job title provided during registration.
            </li>
            <li>
              <strong>Authentication Data:</strong> Hashed passwords and authentication tokens
              managed through our authentication provider.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, features used, timestamps of activity,
              search queries, and interaction patterns within the Service.
            </li>
            <li>
              <strong>Device Information:</strong> IP address, browser type and version, operating
              system, device type, screen resolution, and language preferences.
            </li>
            <li>
              <strong>Payment Information:</strong> Billing address and payment method details
              (processed and stored by our payment processor; we do not store full card numbers).
            </li>
            <li>
              <strong>User-Generated Content:</strong> Tickets, assets, knowledge base articles,
              comments, and any other content you create within the Service.
            </li>
          </ul>
        </Section>

        <Section title="3. Legal Basis for Processing">
          <p>We process your personal data on the following legal bases under GDPR Article 6:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Contract Performance (Art. 6(1)(b)):</strong> Processing necessary to provide
              the Service you have subscribed to.
            </li>
            <li>
              <strong>Legitimate Interest (Art. 6(1)(f)):</strong> Analytics, fraud prevention,
              service improvement, and security monitoring.
            </li>
            <li>
              <strong>Consent (Art. 6(1)(a)):</strong> Marketing communications and non-essential
              cookies, which you may withdraw at any time.
            </li>
            <li>
              <strong>Legal Obligation (Art. 6(1)(c)):</strong> Compliance with tax, accounting,
              and regulatory requirements.
            </li>
          </ul>
        </Section>

        <Section title="4. How We Use Your Data">
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Service Provision:</strong> To create and manage your account, provide access
              to features, and deliver the core functionality of IT Hub Center.
            </li>
            <li>
              <strong>Analytics and Improvement:</strong> To understand usage patterns, diagnose
              technical issues, and improve the Service.
            </li>
            <li>
              <strong>Communication:</strong> To send service-related notifications, security alerts,
              and, with your consent, promotional materials.
            </li>
            <li>
              <strong>Billing and Payments:</strong> To process subscriptions, invoices, and manage
              your billing account.
            </li>
            <li>
              <strong>Security:</strong> To detect, prevent, and respond to fraud, abuse, and
              security incidents.
            </li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your personal data for the following periods:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-600">
                  <th className="text-left py-2 pr-4 font-semibold text-neutral-900 dark:text-white">Data Category</th>
                  <th className="text-left py-2 font-semibold text-neutral-900 dark:text-white">Retention Period</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700 dark:text-neutral-300">
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Account data</td>
                  <td className="py-2">Duration of account + 30 days after deletion</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Usage and analytics data</td>
                  <td className="py-2">24 months from collection</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Billing and invoice data</td>
                  <td className="py-2">10 years (Italian tax law requirement)</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Security logs</td>
                  <td className="py-2">12 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Marketing consent records</td>
                  <td className="py-2">Duration of consent + 3 years</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="6. Your Rights Under GDPR">
          <p>
            As a data subject, you have the following rights under GDPR. To exercise any of these
            rights, contact us at{' '}
            <a href="mailto:privacy@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              privacy@ithubcenter.com
            </a>. We will respond within 30 days.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Right of Access (Art. 15):</strong> Request a copy of the personal data we hold
              about you.
            </li>
            <li>
              <strong>Right to Rectification (Art. 16):</strong> Request correction of inaccurate or
              incomplete personal data.
            </li>
            <li>
              <strong>Right to Erasure (Art. 17):</strong> Request deletion of your personal data
              ("right to be forgotten"), subject to legal retention obligations.
            </li>
            <li>
              <strong>Right to Data Portability (Art. 20):</strong> Receive your data in a structured,
              commonly used, machine-readable format.
            </li>
            <li>
              <strong>Right to Restrict Processing (Art. 18):</strong> Request limitation of
              processing in certain circumstances.
            </li>
            <li>
              <strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate
              interest or for direct marketing purposes.
            </li>
            <li>
              <strong>Right to Withdraw Consent (Art. 7(3)):</strong> Withdraw consent at any time
              without affecting the lawfulness of prior processing.
            </li>
            <li>
              <strong>Right to Lodge a Complaint:</strong> File a complaint with the Italian Data
              Protection Authority (Garante per la protezione dei dati personali) at{' '}
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                www.garanteprivacy.it
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="7. Cookies Policy">
          <p>We use the following categories of cookies:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Strictly Necessary Cookies:</strong> Required for authentication, session
              management, and core functionality. These cannot be disabled.
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how users interact with the
              Service. Enabled only with your consent.
            </li>
            <li>
              <strong>Preference Cookies:</strong> Store your settings such as language, theme,
              and layout preferences.
            </li>
          </ul>
          <p>
            You can manage cookie preferences through your browser settings or our cookie consent
            banner. Disabling non-essential cookies will not affect core Service functionality.
          </p>
        </Section>

        <Section title="8. Third-Party Services">
          <p>
            We share data with the following third-party processors, all of whom are bound by data
            processing agreements (DPAs) compliant with GDPR:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Supabase Inc.</strong> -- Authentication, database hosting, and real-time data
              services. Data is stored in EU data centers. Privacy policy:{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                supabase.com/privacy
              </a>.
            </li>
            <li>
              <strong>Stripe Inc.</strong> -- Payment processing and subscription management. Stripe
              is PCI DSS Level 1 certified. Privacy policy:{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                stripe.com/privacy
              </a>.
            </li>
            <li>
              <strong>Google LLC</strong> -- AI-powered features and natural language processing.
              Data processed under Standard Contractual Clauses for international transfers.
              Privacy policy:{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                policies.google.com/privacy
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="9. International Data Transfers">
          <p>
            Where personal data is transferred outside the European Economic Area (EEA), we ensure
            appropriate safeguards are in place, including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>EU Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
            <li>Adequacy decisions by the European Commission where applicable.</li>
            <li>Data Processing Agreements with all sub-processors.</li>
          </ul>
        </Section>

        <Section title="10. Data Security">
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            data, including encryption in transit (TLS 1.2+) and at rest, access controls,
            regular security audits, and incident response procedures.
          </p>
        </Section>

        <Section title="11. Data Protection Officer (DPO)">
          <p>
            Our Data Protection Officer can be contacted for any privacy-related inquiries:
          </p>
          <p className="mt-2">
            <strong>Email:</strong>{' '}
            <a href="mailto:dpo@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              dpo@ithubcenter.com
            </a>
          </p>
          <p>
            <strong>Company:</strong> BHBlasted S.r.l., Italy
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the updated policy on this page and, where appropriate, sending you an
            email notification. Your continued use of the Service after such changes constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <footer className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            For questions or concerns about this Privacy Policy, contact us at{' '}
            <a href="mailto:privacy@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              privacy@ithubcenter.com
            </a>.
          </p>
          <p className="mt-2">
            BHBlasted S.r.l. -- IT Hub Center -- All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
