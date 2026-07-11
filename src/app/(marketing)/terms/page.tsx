import { LegalPage, LegalSection } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms governing use of ${BRAND.name}.`,
};

export default function TermsOfUsePage() {
  return (
    <LegalPage title="Terms of Use" updated="July 10, 2026">
      <LegalSection title="1. Agreement">
        <p>
          These Terms of Use (&quot;Terms&quot;) govern your access to and use of {BRAND.name} at{" "}
          {BRAND.domain} and related services (the &quot;Service&quot;). By creating an account or
          using the Service, you agree to these Terms and our{" "}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          {BRAND.name} is software that helps landlords, property managers, and tenants manage
          properties, leases, invoices, documents, notices, maintenance requests, and optional bank
          payments. We provide a technology platform only. We are not a law firm, bank, lender,
          escrow agent, or property manager unless we expressly agree otherwise in writing.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts">
        <p>
          You must provide accurate registration information and keep your credentials confidential.
          You are responsible for activity under your account. Notify us promptly of any
          unauthorized use. We may suspend or terminate accounts that violate these Terms or pose a
          risk to the Service or other users.
        </p>
      </LegalSection>

      <LegalSection title="4. Roles and responsibilities">
        <ul>
          <li>
            <strong>Landlords / property managers</strong> are responsible for the accuracy of
            property, lease, invoice, and tenant data they enter; for complying with applicable
            landlord-tenant and housing laws; and for how they use notices, documents, and
            communications generated through the Service.
          </li>
          <li>
            <strong>Tenants</strong> are responsible for reviewing invoices and documents shared
            with them and for payments they authorize.
          </li>
        </ul>
        <p>
          Legal forms and notices available in the Service are templates or tools only. They are not
          legal advice. Requirements vary by jurisdiction — consult your own attorney before serving
          notices or relying on documents.
        </p>
      </LegalSection>

      <LegalSection title="5. Payments and bank connections">
        <p>
          Optional ACH payments may be processed through third-party providers such as Plaid. By
          connecting a bank account or initiating a payment, you authorize the relevant debit or
          credit according to the payment flow shown in the Service. Platform processing fees (if
          any) will be disclosed before payment. Settlement timing depends on banking networks and
          providers. We are not responsible for bank errors, insufficient funds, returned
          transfers, or delays outside our reasonable control.
        </p>
        <p>
          Off-platform payment methods (for example Zelle or Cash App details you add) are between
          the parties; {BRAND.name} does not process those payments.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for unlawful, fraudulent, or abusive purposes</li>
          <li>Upload malware or attempt to disrupt or reverse engineer the Service</li>
          <li>Access another user&apos;s data without authorization</li>
          <li>Misrepresent your identity or authority over a property or tenancy</li>
          <li>Use the Service to harass or send spam</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Your content">
        <p>
          You retain ownership of content you upload (documents, property data, messages, and
          similar). You grant us a limited license to host, process, display, and transmit that
          content solely to operate and improve the Service. You represent that you have the rights
          needed to upload and share that content.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>
          The Service, including software, design, branding, and documentation, is owned by{" "}
          {BRAND.name} or its licensors. Except for the limited rights granted to use the Service,
          no intellectual property rights are transferred to you.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE MAXIMUM
          EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
          THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT DOCUMENTS OR NOTICES WILL MEET
          LEGAL REQUIREMENTS IN YOUR JURISDICTION.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {BRAND.name.toUpperCase()} AND ITS AFFILIATES WILL
          NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
          FOR LOST PROFITS, DATA, OR BUSINESS OPPORTUNITIES. OUR TOTAL LIABILITY FOR CLAIMS ARISING
          OUT OF OR RELATED TO THE SERVICE WILL NOT EXCEED THE AMOUNTS YOU PAID US FOR THE SERVICE
          IN THE TWELVE (12) MONTHS BEFORE THE CLAIM (OR, IF YOU HAVE NOT PAID, ONE HUNDRED U.S.
          DOLLARS).
        </p>
      </LegalSection>

      <LegalSection title="11. Indemnification">
        <p>
          You agree to indemnify and hold harmless {BRAND.name} and its officers, directors,
          employees, and agents from claims arising out of your use of the Service, your content,
          your violation of these Terms, or your violation of applicable law (including landlord-
          tenant disputes between users).
        </p>
      </LegalSection>

      <LegalSection title="12. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate access if you
          breach these Terms or if we discontinue the Service. Provisions that by their nature
          should survive (including ownership, disclaimers, limitations of liability, and
          indemnity) will survive termination.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes">
        <p>
          We may update these Terms by posting a revised version on this page and updating the
          &quot;Last updated&quot; date. Continued use after changes become effective constitutes
          acceptance. If you do not agree, stop using the Service.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a> or{" "}
          <Link href="/contact">Contact</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
