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
            This privacy policy is issued pursuant to Article 13 of Regulation (EU) 2016/679 (GDPR)
            and Italian Legislative Decree 196/2003 (Personal Data Protection Code), as amended by
            Legislative Decree 101/2018. IT Hub Center ("Controller", "we", "us") operates the
            IT Hub Center service (the "Service") and is a company incorporated under Italian law
            with registered office in Italy.
          </p>
        </header>

        <Section title="1. Data Controller">
          <p>
            The Data Controller is <strong>IT Hub Center</strong>, with registered office in Italy.
            For any questions regarding the processing of your personal data, please contact us at:{' '}
            <a href="mailto:privacy@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              privacy@ithubcenter.com
            </a>.
          </p>
        </Section>

        <Section title="2. Data Protection Officer (DPO)">
          <p>
            Our Data Protection Officer can be reached at:
          </p>
          <ul className="list-none space-y-1 ml-2 mt-2">
            <li><strong>Email:</strong>{' '}
              <a href="mailto:dpo@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                dpo@ithubcenter.com
              </a>
            </li>
            <li><strong>Certified Email (PEC):</strong>{' '}
              <a href="mailto:dpo@pec.ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                dpo@pec.ithubcenter.com
              </a>
            </li>
          </ul>
        </Section>

        <Section title="3. Categories of Data Collected">
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Identification data:</strong> Full name, email address, profile picture,
              organization name, and job title provided during registration.
            </li>
            <li>
              <strong>Authentication data:</strong> Passwords (stored in hashed form) and authentication
              tokens managed through our provider (Supabase).
            </li>
            <li>
              <strong>Browsing data:</strong> Pages visited, features used, activity timestamps,
              search queries, and interaction patterns within the Service.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, browser type and version, operating system,
              device type, screen resolution, and language preferences.
            </li>
            <li>
              <strong>Payment data:</strong> Billing address and payment method details (processed and
              stored by our payment processor Stripe; we do not store full card numbers).
            </li>
            <li>
              <strong>User-generated content:</strong> Tickets, assets, knowledge base articles,
              comments, and any other content created within the Service.
            </li>
            <li>
              <strong>Security logs:</strong> Login attempts (successful and failed), changes to
              security settings, and audit trail events in compliance with the NIS2 Directive.
            </li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <p>We process personal data on the following legal bases under GDPR Article 6:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Contract performance (Art. 6(1)(b)):</strong> Processing necessary to provide
              the Service to which the user has subscribed.
            </li>
            <li>
              <strong>Legitimate interest (Art. 6(1)(f)):</strong> Statistical analysis, fraud
              prevention, service improvement, and security monitoring. Our legitimate interest is
              balanced against the rights and freedoms of the data subject through a documented
              Legitimate Interest Assessment (LIA).
            </li>
            <li>
              <strong>Consent (Art. 6(1)(a)):</strong> Marketing communications and non-essential
              cookies, which may be withdrawn at any time without affecting the lawfulness of prior
              processing.
            </li>
            <li>
              <strong>Legal obligation (Art. 6(1)(c)):</strong> Compliance with tax, accounting, and
              regulatory obligations under Italian law (Presidential Decree 633/1972, Presidential
              Decree 600/1973, Legislative Decree 231/2007 on anti-money laundering).
            </li>
          </ul>
        </Section>

        <Section title="5. Purposes of Processing">
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Service delivery:</strong> Account creation and management, access to features,
              and provision of core IT Hub Center functionality.
            </li>
            <li>
              <strong>Analysis and improvement:</strong> Understanding usage patterns, diagnosing
              technical issues, and improving the Service.
            </li>
            <li>
              <strong>Communications:</strong> Sending service-related notifications, security alerts,
              and, with your consent, promotional materials.
            </li>
            <li>
              <strong>Billing and payments:</strong> Processing subscriptions, invoices, and managing
              your billing account.
            </li>
            <li>
              <strong>Security:</strong> Detection, prevention, and response to fraud, abuse, and
              security incidents, in compliance with the NIS2 Directive (Directive (EU) 2022/2555)
              and its Italian transposition (Legislative Decree 138/2024).
            </li>
          </ul>
        </Section>

        <Section title="6. Data Retention Periods">
          <p>
            We retain personal data in accordance with the principle of storage limitation
            (Art. 5(1)(e) GDPR) for the following periods:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-600">
                  <th className="text-left py-2 pr-4 font-semibold text-neutral-900 dark:text-white">Data Category</th>
                  <th className="text-left py-2 pr-4 font-semibold text-neutral-900 dark:text-white">Retention Period</th>
                  <th className="text-left py-2 font-semibold text-neutral-900 dark:text-white">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700 dark:text-neutral-300">
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Account data</td>
                  <td className="py-2 pr-4">Duration of relationship + 30 days</td>
                  <td className="py-2">Art. 6(1)(b) GDPR</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Browsing and analytics data</td>
                  <td className="py-2 pr-4">24 months from collection</td>
                  <td className="py-2">Art. 6(1)(f) GDPR</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Billing and invoice data</td>
                  <td className="py-2 pr-4">10 years</td>
                  <td className="py-2">Art. 2220 Italian Civil Code, Presidential Decree 633/1972</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Security and audit logs</td>
                  <td className="py-2 pr-4">12 months</td>
                  <td className="py-2">Italian DPA Order 27/11/2008, NIS2</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4">Marketing consent records</td>
                  <td className="py-2 pr-4">Duration of consent + 3 years</td>
                  <td className="py-2">Art. 7 GDPR, burden of proof</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Contractual data (litigation)</td>
                  <td className="py-2 pr-4">10 years from termination</td>
                  <td className="py-2">Art. 2946 Italian Civil Code (ordinary limitation period)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="7. Your Rights as a Data Subject">
          <p>
            Under Articles 15-22 of the GDPR and Articles 7-10 of Legislative Decree 196/2003,
            you have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Access (Art. 15):</strong> Obtain confirmation of whether your data is being
              processed and receive a copy of your personal data.
            </li>
            <li>
              <strong>Rectification (Art. 16):</strong> Request correction of inaccurate data or
              completion of incomplete data.
            </li>
            <li>
              <strong>Erasure (Art. 17):</strong> Request deletion of your personal data ("right to
              be forgotten"), subject to legal retention obligations.
            </li>
            <li>
              <strong>Data portability (Art. 20):</strong> Receive your data in a structured, commonly
              used, and machine-readable format (JSON, CSV).
            </li>
            <li>
              <strong>Restriction of processing (Art. 18):</strong> Request limitation of processing
              in the circumstances provided by law.
            </li>
            <li>
              <strong>Object (Art. 21):</strong> Object to processing based on legitimate interest or
              for direct marketing purposes.
            </li>
            <li>
              <strong>Withdraw consent (Art. 7(3)):</strong> Withdraw consent at any time without
              affecting the lawfulness of processing based on consent given prior to withdrawal.
            </li>
            <li>
              <strong>Automated decision-making (Art. 22):</strong> Not be subject to decisions based
              solely on automated processing that produce legal or similarly significant effects. The
              AI features of the Service provide suggestions that always require human confirmation.
            </li>
          </ul>
          <p className="mt-4">
            To exercise your rights, contact:{' '}
            <a href="mailto:privacy@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              privacy@ithubcenter.com
            </a>. We will respond within 30 days of receiving your request, extendable by a further 60
            days for complex requests (Art. 12(3) GDPR), with a reasoned explanation.
          </p>
        </Section>

        <Section title="8. Right to Lodge a Complaint">
          <p>
            You have the right to lodge a complaint with the Italian Data Protection Authority
            (Garante per la protezione dei dati personali):
          </p>
          <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded-xl p-4 mt-2 text-sm space-y-1">
            <p><strong>Garante per la protezione dei dati personali</strong></p>
            <p>Piazza Venezia, 11 &mdash; 00187 Rome, Italy</p>
            <p>Phone: (+39) 06.696771</p>
            <p>Email:{' '}
              <a href="mailto:garante@gpdp.it" className="text-primary-600 dark:text-primary-400 underline">garante@gpdp.it</a>
            </p>
            <p>Certified Email (PEC):{' '}
              <a href="mailto:protocollo@pec.gpdp.it" className="text-primary-600 dark:text-primary-400 underline">protocollo@pec.gpdp.it</a>
            </p>
            <p>Website:{' '}
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline">www.garanteprivacy.it</a>
            </p>
          </div>
        </Section>

        <Section title="9. Cookie Policy">
          <p>
            In compliance with the Italian Data Protection Authority's Guidelines of June 10, 2021
            ("Guidelines on cookies and other tracking tools") and Directive 2002/58/EC (ePrivacy),
            we use the following categories of cookies:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Strictly necessary cookies:</strong> Required for authentication, session
              management, and core functionality. These do not require consent (Art. 122(1),
              Legislative Decree 196/2003).
            </li>
            <li>
              <strong>Analytics cookies:</strong> Help us understand how users interact with the
              Service. Enabled only with your consent.
            </li>
            <li>
              <strong>Preference cookies:</strong> Store your settings such as language, theme,
              and layout preferences.
            </li>
          </ul>
          <p>
            You can manage cookie preferences through your browser settings or our cookie consent
            banner. Disabling non-essential cookies will not affect core Service functionality.
          </p>
        </Section>

        <Section title="10. Data Processors (Sub-processors)">
          <p>
            We engage the following data processors (Art. 28 GDPR), all bound by GDPR-compliant
            Data Processing Agreements (DPAs):
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-600">
                  <th className="text-left py-2 pr-4 font-semibold text-neutral-900 dark:text-white">Provider</th>
                  <th className="text-left py-2 pr-4 font-semibold text-neutral-900 dark:text-white">Purpose</th>
                  <th className="text-left py-2 pr-4 font-semibold text-neutral-900 dark:text-white">Data Location</th>
                  <th className="text-left py-2 font-semibold text-neutral-900 dark:text-white">Safeguards</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700 dark:text-neutral-300">
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4"><strong>Supabase Inc.</strong></td>
                  <td className="py-2 pr-4">Authentication, database, real-time services</td>
                  <td className="py-2 pr-4">EU (Frankfurt)</td>
                  <td className="py-2">SOC 2 Type II, ISO 27001, DPA</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4"><strong>Stripe Inc.</strong></td>
                  <td className="py-2 pr-4">Payment processing and subscriptions</td>
                  <td className="py-2 pr-4">EU/USA</td>
                  <td className="py-2">PCI DSS Level 1, SCCs, DPA</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <td className="py-2 pr-4"><strong>Google LLC</strong></td>
                  <td className="py-2 pr-4">AI features and NLP</td>
                  <td className="py-2 pr-4">EU/USA</td>
                  <td className="py-2">SCCs, EU-US DPF, DPA</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><strong>Vercel Inc.</strong></td>
                  <td className="py-2 pr-4">Hosting and CDN distribution</td>
                  <td className="py-2 pr-4">EU (edge)</td>
                  <td className="py-2">SOC 2 Type II, SCCs, DPA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="11. International Data Transfers">
          <p>
            Where personal data is transferred outside the European Economic Area (EEA), we ensure
            appropriate safeguards under Chapter V of the GDPR (Articles 44-49):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>EU Standard Contractual Clauses (SCCs) approved by the European Commission (Decision 2021/914).</li>
            <li>EU-US Data Privacy Framework for transfers to the United States (Adequacy Decision 2023/1795).</li>
            <li>European Commission adequacy decisions where applicable.</li>
            <li>Transfer Impact Assessment (TIA) for each extra-EU transfer.</li>
          </ul>
        </Section>

        <Section title="12. Data Security">
          <p>
            We implement appropriate technical and organizational measures pursuant to Article 32 GDPR
            and in compliance with the NIS2 Directive (Directive (EU) 2022/2555, transposed by Italian
            Legislative Decree 138/2024):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Data encryption in transit (TLS 1.3) and at rest (AES-256).</li>
            <li>Row-Level Security (RLS) on every database table.</li>
            <li>Role-Based Access Control (RBAC).</li>
            <li>Two-Factor Authentication (2FA/TOTP).</li>
            <li>Content Security Policy (CSP) and security headers (OWASP).</li>
            <li>Strong password policy (12+ characters, mandatory complexity).</li>
            <li>Account lockout after 5 failed login attempts.</li>
            <li>Audit trail with 12-month retention.</li>
            <li>Periodic security reviews and incident response procedures.</li>
          </ul>
        </Section>

        <Section title="13. Data Breach Notification">
          <p>
            In the event of a personal data breach under Article 33 GDPR, we will:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Notify the Italian Data Protection Authority (Garante) within 72 hours of becoming
              aware of the breach, unless it is unlikely that the breach poses a risk to the rights
              and freedoms of individuals.</li>
            <li>Communicate the breach to affected data subjects without undue delay where the breach
              is likely to result in a high risk (Art. 34 GDPR).</li>
            <li>Document all breaches in our internal register pursuant to Article 33(5) GDPR.</li>
          </ul>
        </Section>

        <Section title="14. Children's Data">
          <p>
            The Service is not intended for individuals under the age of 14 (Art. 8 GDPR, as
            specified by Art. 2-quinquies of Legislative Decree 196/2003). We do not knowingly
            collect personal data from children under 14. If we become aware that we have collected
            data from a minor without parental or guardian consent, we will promptly delete such data.
          </p>
        </Section>

        <Section title="15. Automated Decision-Making and Profiling">
          <p>
            The Service uses artificial intelligence features for automatic ticket triage and
            operational suggestions. Under Article 22 GDPR:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>No decision producing legal effects is made in a fully automated manner.</li>
            <li>AI suggestions always require human confirmation and validation.</li>
            <li>You have the right to obtain human intervention, express your point of view, and
              contest the decision.</li>
          </ul>
        </Section>

        <Section title="16. Changes to This Policy">
          <p>
            We reserve the right to update this privacy policy. Material changes will be communicated
            by posting the updated policy on this page and, where appropriate, via email notification.
            The last update date is shown at the top. Continued use of the Service after changes
            constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="17. Applicable Legislation">
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Regulation (EU) 2016/679 (GDPR)</li>
            <li>Italian Legislative Decree 196/2003 (Privacy Code), as amended by Legislative Decree 101/2018</li>
            <li>Directive (EU) 2022/2555 (NIS2), transposed by Italian Legislative Decree 138/2024</li>
            <li>Directive 2002/58/EC (ePrivacy)</li>
            <li>Italian DPA Guidelines of June 10, 2021 (Cookie Guidelines)</li>
            <li>Italian DPA Order of November 27, 2008 (System Administrators)</li>
            <li>Presidential Decree 633/1972 and Presidential Decree 600/1973 (tax obligations)</li>
          </ul>
        </Section>

        <Section title="18. Contact Information">
          <div className="space-y-2">
            <p><strong>Data Controller:</strong> IT Hub Center &mdash; Italy, EU</p>
            <p><strong>Privacy:</strong>{' '}
              <a href="mailto:privacy@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                privacy@ithubcenter.com
              </a>
            </p>
            <p><strong>DPO:</strong>{' '}
              <a href="mailto:dpo@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                dpo@ithubcenter.com
              </a>
            </p>
          </div>
        </Section>

        <footer className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            For questions or concerns about this privacy policy, contact us at:{' '}
            <a href="mailto:privacy@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              privacy@ithubcenter.com
            </a>.
          </p>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} IT Hub Center. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
