import { LegalPage, LegalSection } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND.name} collects, uses, and protects your information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 10, 2026">
      <LegalSection title="1. Who we are">
        <p>
          {BRAND.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides property
          management software at {BRAND.domain}, including rent tracking, documents, notices, and
          optional bank payment features. This Privacy Policy explains how we handle information
          when you visit our website or use our services.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>We may collect:</p>
        <ul>
          <li>
            <strong>Account information</strong> — name, email address, password (stored securely by
            our authentication provider), role (landlord, tenant, or admin), and profile details you
            provide.
          </li>
          <li>
            <strong>Property and tenancy data</strong> — property addresses, unit details, lease
            information, invoices, payment records, maintenance requests, and documents you upload
            or generate.
          </li>
          <li>
            <strong>Payment and bank connection data</strong> — when you connect a bank account
            through Plaid, we receive tokens and limited account details (such as institution name
            and account mask) needed to process ACH payments. We do not receive or store your bank
            login password.
          </li>
          <li>
            <strong>Communications</strong> — messages you send us, and emails or texts sent through
            the platform (for example invoices, notices, or password resets).
          </li>
          <li>
            <strong>Technical data</strong> — IP address, browser type, device information, and
            usage logs needed to operate, secure, and improve the service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use information to:</p>
        <ul>
          <li>Provide, maintain, and improve {BRAND.name}</li>
          <li>Authenticate users and manage accounts</li>
          <li>Process rent invoices and optional bank payments</li>
          <li>Send transactional emails and notifications you enable</li>
          <li>Provide customer support and respond to requests</li>
          <li>Detect, prevent, and address fraud, abuse, or security issues</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="4. How we share information">
        <p>We may share information with:</p>
        <ul>
          <li>
            <strong>Service providers</strong> that help us run the product (for example hosting,
            database, email delivery, and payment/bank linking partners such as Plaid), under
            contracts that limit their use of your data.
          </li>
          <li>
            <strong>Other users on your account relationship</strong> — for example, landlords and
            tenants may see information needed for their tenancy (invoices, documents, repair
            requests).
          </li>
          <li>
            <strong>Legal and safety</strong> — when required by law, or to protect rights, safety,
            and the integrity of the service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Bank connections (Plaid)">
        <p>
          If you connect a bank account, Plaid processes that connection. Plaid&apos;s privacy
          practices are described in their own policies. We store access tokens and limited account
          metadata needed to initiate transfers you request. You can disconnect a bank connection
          from your dashboard settings when the feature is available.
        </p>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <p>
          We retain account and property data while your account is active and as needed to provide
          the service, resolve disputes, enforce agreements, and meet legal, tax, or accounting
          requirements. You may request deletion of your account by contacting us; some records may
          be retained where we are legally required to keep them.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use industry-standard safeguards, including encrypted connections (HTTPS) and access
          controls. No method of transmission or storage is completely secure, and we cannot
          guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="8. Children">
        <p>
          {BRAND.name} is not directed to children under 13, and we do not knowingly collect
          personal information from children under 13.
        </p>
      </LegalSection>

      <LegalSection title="9. Your choices">
        <p>
          You may update profile information in your account settings, manage notification
          preferences where available, and contact us to request access, correction, or deletion of
          personal information we hold about you, subject to applicable law.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised version on
          this page and update the &quot;Last updated&quot; date. Continued use of the service after
          changes become effective constitutes acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          For privacy questions, email{" "}
          <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a> or visit our{" "}
          <Link href="/contact">Contact</Link> page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
