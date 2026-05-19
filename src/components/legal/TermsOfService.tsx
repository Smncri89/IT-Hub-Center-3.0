import React, { useEffect } from 'react';
import { useLocalization } from '@/hooks/useLocalization';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">{title}</h2>
    <div className="text-neutral-700 dark:text-neutral-300 space-y-3 leading-relaxed">{children}</div>
  </section>
);

const TermsOfService: React.FC = () => {
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
            Terms of Service
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: May 2026
          </p>
          <p className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of IT Hub Center
            (the "Service"), operated by IT Hub Center ("Company", "we", "us"), a company
            incorporated under Italian law with registered office in Italy. By accessing or using
            the Service, you agree to be bound by these Terms pursuant to Articles 1341 and 1342
            of the Italian Civil Code. If you do not agree, you must not use the Service.
          </p>
        </header>

        <Section title="1. Service Description">
          <p>
            IT Hub Center is a cloud-based IT Service Management (ITSM) platform that provides:
            ticket management, asset tracking, knowledge base, incident management, reporting,
            analytics, and AI-assisted support tools. The Service is delivered as
            Software-as-a-Service (SaaS) and is accessible via web browser and Progressive Web
            App (PWA).
          </p>
        </Section>

        <Section title="2. Registration and Account">
          <h3 className="font-semibold text-neutral-900 dark:text-white mt-2">2.1 Registration requirements</h3>
          <p>
            To use the Service, you must create an account by providing accurate, complete, and
            up-to-date information. You must be at least 14 years of age (pursuant to Art.
            2-quinquies of Italian Legislative Decree 196/2003). If you register on behalf of an
            organization, you represent and warrant that you have the authority to bind that
            organization to these Terms.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">2.2 Account security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your credentials and for all
            activities that occur under your account. The platform implements security measures in
            compliance with the NIS2 Directive (Italian Legislative Decree 138/2024), including:
            strong passwords (minimum 12 characters), two-factor authentication (2FA/TOTP), and
            account lockout after 5 failed attempts. Any unauthorized access must be reported
            immediately to:{' '}
            <a href="mailto:security@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              security@ithubcenter.com
            </a>.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">2.3 Account termination</h3>
          <p>
            You may close your account at any time through your account settings. We reserve the
            right to suspend or terminate your account in the event of a breach of these Terms,
            non-payment, or conduct harmful to the Service or other users. Upon termination, your
            data will be retained for 30 days, after which it will be permanently deleted, unless
            retention is required by law (Art. 2220 Italian Civil Code, tax legislation).
          </p>
        </Section>

        <Section title="3. Plans and Payment Terms">
          <h3 className="font-semibold text-neutral-900 dark:text-white mt-2">3.1 Pricing plans</h3>
          <p>
            The Service is offered under multiple subscription plans (Free, Pro, Enterprise).
            Current pricing is available on our website. All prices are exclusive of VAT pursuant
            to Presidential Decree 633/1972, unless otherwise stated. We reserve the right to
            change pricing with 30 days' advance notice; changes will not affect the current
            billing cycle.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">3.2 Billing</h3>
          <p>
            Paid subscriptions are billed in advance on a monthly or annual basis. Electronic
            invoices are issued in compliance with Italian Legislative Decree 127/2015 and
            transmitted through the Revenue Agency's Exchange System (Sistema di Interscambio, SdI)
            where applicable. Payments are processed through Stripe and are subject to Stripe's
            terms of service.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">3.3 Free trial</h3>
          <p>
            New accounts may be eligible for a 30-day free trial with full access to Pro features.
            At the end of the trial, your account will automatically revert to the Free plan unless
            you subscribe to a paid plan. No payment information is required to start a trial.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">3.4 Right of withdrawal</h3>
          <p>
            Pursuant to Articles 52-59 of Italian Legislative Decree 206/2005 (Consumer Code) and
            Directive 2011/83/EU, consumers have the right to withdraw from the contract within
            14 days of subscription, without providing any reason and without penalty. To exercise
            the right of withdrawal, send a notice to:{' '}
            <a href="mailto:legal@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              legal@ithubcenter.com
            </a>.
            Refunds will be issued within 14 days of receiving the withdrawal notice, using the
            same payment method as the original transaction.
          </p>
          <p>
            The right of withdrawal is excluded in the cases provided by Article 59 of the Consumer
            Code, in particular when service performance has begun with the consumer's express
            agreement and acceptance of the loss of the right of withdrawal upon full contract
            execution.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">3.5 Refunds</h3>
          <p>
            Outside of the statutory right of withdrawal, we offer a 14-day refund window from the
            start of each billing cycle. Requests must be sent to{' '}
            <a href="mailto:legal@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              legal@ithubcenter.com
            </a>.
            Refunds are processed within 10 business days. Partial refunds are not available
            outside this window.
          </p>
        </Section>

        <Section title="4. Acceptable Use Policy">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation.</li>
            <li>Upload, transmit, or distribute any malicious code, viruses, or harmful content.</li>
            <li>Attempt to gain unauthorized access to other users' accounts or any part of the Service infrastructure.</li>
            <li>Use the Service to send unsolicited communications (spam) or engage in phishing.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service, except as permitted
              under Directive 2009/24/EC on the legal protection of computer programs.</li>
            <li>Resell, sublicense, or redistribute the Service without our prior written consent.</li>
            <li>Use automated tools (bots, scrapers) to access the Service except through our published APIs.</li>
            <li>Store or process data that violates third-party intellectual property rights.</li>
          </ul>
          <p>
            Violation of this policy may result in immediate suspension or termination of your
            account without refund.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          <h3 className="font-semibold text-neutral-900 dark:text-white mt-2">5.1 Our intellectual property</h3>
          <p>
            The Service, including its source code, design, logos, trademarks, and documentation,
            is the exclusive property of IT Hub Center and is protected by Italian Law 633/1941
            (Copyright Law), Italian Legislative Decree 30/2005 (Industrial Property Code), and
            international intellectual property laws. Nothing in these Terms grants you any right,
            title, or interest in the Service beyond the limited license to use it as described herein.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">5.2 Your content</h3>
          <p>
            You retain all ownership rights to the content you create, upload, or store within the
            Service ("Your Content"). By using the Service, you grant us a limited, non-exclusive
            license to host, store, and display Your Content solely for the purpose of providing
            the Service. We will not access, use, or share Your Content for any other purpose
            without your explicit consent.
          </p>
        </Section>

        <Section title="6. Service Availability and Support">
          <p>
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted availability.
            Scheduled maintenance windows will be communicated in advance. Support is provided
            through email and in-app channels; response times vary by plan level.
          </p>
        </Section>

        <Section title="7. Warranty and Limitation of Liability">
          <p>To the maximum extent permitted by applicable law:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              The Service is provided "as is" and "as available" without warranties of any kind,
              whether express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </li>
            <li>
              IT Hub Center shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages, including loss of profits, data, goodwill, or other intangible losses.
            </li>
            <li>
              Our total aggregate liability for any claims shall not exceed the amounts paid by you
              in the 12 months preceding the claim.
            </li>
            <li>
              Nothing in these Terms excludes or limits our liability for willful misconduct (dolo),
              gross negligence (colpa grave), death or personal injury caused by negligence, or any
              other liability that cannot be excluded under Italian law (Art. 1229 Italian Civil Code).
            </li>
            <li>
              Pursuant to Articles 128-135 of Italian Legislative Decree 206/2005 (Consumer Code),
              consumers benefit from the legal guarantee of conformity for digital content and services.
            </li>
          </ul>
        </Section>

        <Section title="8. Indemnification">
          <p>
            You agree to indemnify and hold harmless IT Hub Center, its directors, officers,
            employees, and agents from any claims, damages, losses, or expenses (including
            reasonable legal fees) arising from your use of the Service, your violation of these
            Terms, or your infringement of any third-party rights.
          </p>
        </Section>

        <Section title="9. Force Majeure">
          <p>
            IT Hub Center shall not be liable for delays or failures to perform resulting from
            force majeure events under Article 1218 of the Italian Civil Code, including but not
            limited to: natural disasters, pandemics, acts of war or terrorism, telecommunications
            outages, third-party infrastructure failures, and governmental or regulatory actions.
            In the event of force majeure lasting more than 30 days, either party may terminate
            the contract without liability.
          </p>
        </Section>

        <Section title="10. Modifications to Terms">
          <p>
            We reserve the right to modify these Terms. Material changes will be communicated at
            least 30 days in advance via email or in-app notification, pursuant to Article 1341
            of the Italian Civil Code. Continued use of the Service after the effective date
            constitutes acceptance of the revised Terms. If you do not agree with the changes,
            you must stop using the Service and close your account.
          </p>
        </Section>

        <Section title="11. Governing Law and Jurisdiction">
          <p>
            These Terms are governed by and construed in accordance with the laws of the Italian
            Republic. For consumers, the exclusive jurisdiction lies with the court of the
            consumer's place of residence or domicile, pursuant to Article 66-bis of Italian
            Legislative Decree 206/2005 (Consumer Code).
          </p>
          <p>
            For business users (B2B), the exclusive jurisdiction lies with the Court of Naples, Italy.
          </p>
        </Section>

        <Section title="12. Alternative Dispute Resolution (ADR/ODR)">
          <p>
            Pursuant to Italian Legislative Decree 130/2015 (implementing Directive 2013/11/EU on
            consumer alternative dispute resolution), we inform you that:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              You may use the European Commission's Online Dispute Resolution (ODR) platform:{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                ec.europa.eu/consumers/odr
              </a>.
            </li>
            <li>
              You may initiate mediation proceedings pursuant to Italian Legislative Decree 28/2010
              before a mediation body registered with the Italian Ministry of Justice.
            </li>
            <li>
              You may file a complaint with the Italian Competition and Market Authority (AGCM)
              for unfair commercial practices under Articles 20-27 of the Consumer Code.
            </li>
          </ul>
        </Section>

        <Section title="13. Unfair Terms Notice">
          <p>
            Pursuant to Articles 1341 and 1342 of the Italian Civil Code and Articles 33-38 of
            Italian Legislative Decree 206/2005 (Consumer Code), the following clauses are
            specifically brought to your attention:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Art. 2.3 &mdash; Account termination and service suspension</li>
            <li>Art. 4 &mdash; Acceptable use policy and consequences of violation</li>
            <li>Art. 7 &mdash; Limitation of liability</li>
            <li>Art. 8 &mdash; Indemnification clause</li>
            <li>Art. 9 &mdash; Force majeure</li>
            <li>Art. 10 &mdash; Unilateral modification of Terms</li>
            <li>Art. 11 &mdash; Jurisdiction (business users)</li>
          </ul>
          <p className="mt-2 text-sm italic text-neutral-500 dark:text-neutral-400">
            By accepting these Terms, you specifically approve the clauses listed above pursuant
            to Article 1341, paragraph 2, of the Italian Civil Code.
          </p>
        </Section>

        <Section title="14. Severability">
          <p>
            If any provision of these Terms is found to be invalid or unenforceable by a court of
            competent jurisdiction, the remaining provisions shall continue in full force and effect.
          </p>
        </Section>

        <Section title="15. Applicable Legislation">
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Italian Civil Code (Royal Decree 262/1942), in particular Articles 1218, 1229, 1341, 1342, 1453-1462, 2220, 2946</li>
            <li>Italian Legislative Decree 206/2005 (Consumer Code)</li>
            <li>Italian Legislative Decree 70/2003 (E-Commerce, implementing Directive 2000/31/EC)</li>
            <li>Italian Legislative Decree 82/2005 (Digital Administration Code)</li>
            <li>Regulation (EU) 2016/679 (GDPR)</li>
            <li>Italian Legislative Decree 196/2003 (Privacy Code), as amended by Legislative Decree 101/2018</li>
            <li>Directive (EU) 2022/2555 (NIS2), transposed by Italian Legislative Decree 138/2024</li>
            <li>Italian Legislative Decree 130/2015 (Consumer ADR)</li>
            <li>Italian Legislative Decree 28/2010 (Civil and commercial mediation)</li>
            <li>Italian Law 633/1941 (Copyright Law)</li>
            <li>Italian Legislative Decree 30/2005 (Industrial Property Code)</li>
          </ul>
        </Section>

        <Section title="16. Contact Information">
          <div className="space-y-2">
            <p><strong>Company:</strong> IT Hub Center &mdash; Italy, EU</p>
            <p><strong>Legal:</strong>{' '}
              <a href="mailto:legal@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                legal@ithubcenter.com
              </a>
            </p>
            <p><strong>Security:</strong>{' '}
              <a href="mailto:security@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
                security@ithubcenter.com
              </a>
            </p>
          </div>
        </Section>

        <footer className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            By using IT Hub Center, you acknowledge that you have read, understood, and agree to
            be bound by these Terms of Service.
          </p>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} IT Hub Center. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TermsOfService;
