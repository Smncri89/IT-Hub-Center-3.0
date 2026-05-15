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
            These Terms of Service ("Terms") govern your access to and use of IT Hub Center (the
            "Service"), operated by BHBlasted S.r.l. ("Company", "we", "us"), a company incorporated
            under the laws of Italy. By accessing or using the Service, you agree to be bound by
            these Terms. If you do not agree, you must not use the Service.
          </p>
        </header>

        <Section title="1. Service Description">
          <p>
            IT Hub Center is a cloud-based IT Service Management (ITSM) platform that provides
            ticket management, asset tracking, knowledge base, incident management, reporting,
            analytics, and AI-assisted support tools. The Service is provided as Software-as-a-Service
            (SaaS) and is accessible via web browser and progressive web application (PWA).
          </p>
        </Section>

        <Section title="2. Account Terms">
          <h3 className="font-semibold text-neutral-900 dark:text-white mt-2">2.1 Registration</h3>
          <p>
            To use the Service, you must create an account by providing accurate, complete, and
            current information. You must be at least 16 years of age. If you register on behalf of
            an organization, you represent that you have the authority to bind that organization to
            these Terms.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">2.2 Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account. You must immediately notify us at{' '}
            <a href="mailto:legal@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              legal@ithubcenter.com
            </a>{' '}
            of any unauthorized use of your account or any other security breach.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">2.3 Account Termination</h3>
          <p>
            You may terminate your account at any time through the account settings. We reserve the
            right to suspend or terminate your account if you violate these Terms, fail to pay
            applicable fees, or engage in conduct that we reasonably believe is harmful to the
            Service or other users. Upon termination, your right to access the Service ceases
            immediately. We will retain your data for 30 days after termination, after which it
            will be permanently deleted unless retention is required by law.
          </p>
        </Section>

        <Section title="3. Payment Terms">
          <h3 className="font-semibold text-neutral-900 dark:text-white mt-2">3.1 Plans and Pricing</h3>
          <p>
            The Service is offered under multiple subscription plans (Free, Pro, Enterprise).
            Current pricing is available on our website. We reserve the right to change pricing with
            30 days' advance notice. Price changes will not affect the current billing cycle.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">3.2 Billing Cycles</h3>
          <p>
            Paid subscriptions are billed in advance on a monthly or annual basis, depending on the
            plan selected. All fees are exclusive of applicable taxes unless otherwise stated. Payments
            are processed through Stripe and are subject to Stripe's terms of service.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">3.3 Free Trial</h3>
          <p>
            New accounts may be eligible for a free trial period. During the trial, you have access
            to Pro features at no charge. At the end of the trial, your account will automatically
            revert to the Free plan unless you subscribe to a paid plan. No payment information is
            required to start a trial.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">3.4 Refund Policy</h3>
          <p>
            We offer a 14-day refund window from the start of each billing cycle. Refund requests
            must be submitted to{' '}
            <a href="mailto:legal@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              legal@ithubcenter.com
            </a>.
            Refunds are processed within 10 business days to the original payment method. Partial
            month or partial year refunds are not available outside the 14-day window. This does not
            affect your statutory withdrawal rights under EU consumer protection law.
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
            <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
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
          <h3 className="font-semibold text-neutral-900 dark:text-white mt-2">5.1 Our Intellectual Property</h3>
          <p>
            The Service, including its source code, design, logos, trademarks, and documentation,
            is the exclusive property of BHBlasted S.r.l. and is protected by Italian and
            international intellectual property laws. Nothing in these Terms grants you any right,
            title, or interest in the Service beyond the limited license to use it as described herein.
          </p>

          <h3 className="font-semibold text-neutral-900 dark:text-white mt-4">5.2 Your Content</h3>
          <p>
            You retain all ownership rights to the content you create, upload, or store within the
            Service ("Your Content"). By using the Service, you grant us a limited, non-exclusive
            license to host, store, and display Your Content solely for the purpose of providing
            the Service to you. We will not access, use, or share Your Content for any other purpose
            without your explicit consent.
          </p>
        </Section>

        <Section title="6. Service Availability and Support">
          <p>
            We strive to maintain 99.9% uptime for the Service but do not guarantee uninterrupted
            availability. Scheduled maintenance windows will be communicated in advance. We provide
            support through email and in-app channels. Response times vary by plan level.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              The Service is provided "as is" and "as available" without warranties of any kind,
              whether express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </li>
            <li>
              In no event shall BHBlasted S.r.l. be liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of profits, data, goodwill, or
              other intangible losses.
            </li>
            <li>
              Our total aggregate liability for any claims arising from or related to these Terms or
              the Service shall not exceed the amounts paid by you to us in the 12 months preceding
              the claim.
            </li>
            <li>
              Nothing in these Terms excludes or limits our liability for death or personal injury
              caused by negligence, fraud, or any other liability that cannot be excluded under
              applicable law.
            </li>
          </ul>
        </Section>

        <Section title="8. Indemnification">
          <p>
            You agree to indemnify and hold harmless BHBlasted S.r.l., its officers, directors,
            employees, and agents from any claims, damages, losses, or expenses (including reasonable
            legal fees) arising from your use of the Service, your violation of these Terms, or your
            infringement of any third-party rights.
          </p>
        </Section>

        <Section title="9. Modifications to Terms">
          <p>
            We reserve the right to modify these Terms at any time. Material changes will be
            communicated at least 30 days in advance via email or in-app notification. Your
            continued use of the Service after the effective date of any changes constitutes
            acceptance of the revised Terms. If you do not agree with the changes, you must stop
            using the Service and close your account.
          </p>
        </Section>

        <Section title="10. Governing Law and Jurisdiction">
          <p>
            These Terms are governed by and construed in accordance with the laws of the Italian
            Republic, without regard to conflict of law principles. Any disputes arising from or
            relating to these Terms or the Service shall be subject to the exclusive jurisdiction
            of the courts of Italy.
          </p>
          <p>
            For consumers residing in the European Union, this does not affect your right to bring
            proceedings in the courts of your country of residence pursuant to applicable EU consumer
            protection regulations (Regulation (EU) No 1215/2012). You may also use the European
            Commission's Online Dispute Resolution platform at{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </Section>

        <Section title="11. Severability">
          <p>
            If any provision of these Terms is found to be invalid or unenforceable by a court of
            competent jurisdiction, the remaining provisions shall continue in full force and effect.
          </p>
        </Section>

        <Section title="12. Contact Information">
          <p>
            For any questions about these Terms, please contact us:
          </p>
          <p className="mt-2">
            <strong>Email:</strong>{' '}
            <a href="mailto:legal@ithubcenter.com" className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300">
              legal@ithubcenter.com
            </a>
          </p>
          <p>
            <strong>Company:</strong> BHBlasted S.r.l., Italy
          </p>
        </Section>

        <footer className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            By using IT Hub Center, you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service.
          </p>
          <p className="mt-2">
            BHBlasted S.r.l. -- IT Hub Center -- All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TermsOfService;
