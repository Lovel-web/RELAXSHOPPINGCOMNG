import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2d7a2d] transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo-rs.jpg" alt="RelaxShopping" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-extrabold text-sm hidden sm:block">
              <span className="text-[#2d7a2d]">Relax</span>
              <span className="text-[#e07b00]">Shopping</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#2d7a2d] to-[#3d9c3d] px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-8 w-8 opacity-80" />
              <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Legal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Privacy Policy</h1>
            <p className="text-green-100 text-sm">Last updated: March 2026</p>
          </div>

          <div className="px-8 py-10 prose prose-sm max-w-none text-gray-700 space-y-8">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p className="leading-relaxed">
                RelaxShopping ("we," "us," or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform, including our website, mobile interface, and WhatsApp-based community systems.
              </p>
              <p className="leading-relaxed mt-3">
                By using RelaxShopping, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <h3 className="text-base font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
              <p className="leading-relaxed">When you register or transact on RelaxShopping, we may collect:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Full name and phone number</li>
                <li>Email address (for account authentication)</li>
                <li>Location data: State, Local Government Area (LGA), and Estate</li>
                <li>Bank account details (for vendors only — for payment disbursement)</li>
                <li>Order history and transaction records</li>
              </ul>
              <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.2 Automatically Collected Data</h3>
              <p className="leading-relaxed">We automatically collect certain technical data when you use our platform, including:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>IP address and device type</li>
                <li>Browser type and version</li>
                <li>Pages visited and interaction logs</li>
                <li>Session timestamps</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Payment Processing</h2>
              <p className="leading-relaxed">
                All payment transactions on RelaxShopping are processed through <strong>Paystack</strong>, a PCI-DSS compliant payment processor. We do not store your card details or sensitive payment credentials on our servers. Payment information is transmitted directly to Paystack using industry-standard encryption.
              </p>
              <p className="leading-relaxed mt-3">
                Vendor bank account details (account number, bank name) are stored solely for the purpose of processing vendor settlements via the Paystack Transfer API. This information is encrypted at rest and never shared with third parties beyond what is necessary for payment processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. WhatsApp Communication</h2>
              <p className="leading-relaxed">
                RelaxShopping uses WhatsApp as a community communication tool. By joining an LGA WhatsApp group through our platform, you acknowledge that:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Your phone number will be visible to group members and administrators</li>
                <li>Order updates and delivery notifications may be shared within your LGA group</li>
                <li>WhatsApp's own terms of service and privacy policy also apply to communications made through their platform</li>
                <li>RelaxShopping is not responsible for content shared by third parties within WhatsApp groups</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. How We Use Your Information</h2>
              <p className="leading-relaxed">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Creating and managing your account</li>
                <li>Processing and fulfilling orders</li>
                <li>Communicating order status and delivery updates</li>
                <li>Processing vendor payments and settlements</li>
                <li>Improving our platform through analytics</li>
                <li>Complying with legal obligations</li>
                <li>Preventing fraud and maintaining platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. User Responsibilities</h2>
              <p className="leading-relaxed">As a user of RelaxShopping, you are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Providing accurate, truthful personal information during registration</li>
                <li>Keeping your account credentials secure and confidential</li>
                <li>Promptly notifying us of any unauthorised access to your account</li>
                <li>Using the platform in compliance with all applicable Nigerian laws</li>
                <li>Not sharing your account with third parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Vendor Responsibilities</h2>
              <p className="leading-relaxed">Vendors registered on RelaxShopping are additionally responsible for:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Providing accurate bank account information for payment disbursement</li>
                <li>Ensuring product listings are truthful and not misleading</li>
                <li>Complying with applicable product safety and quality standards</li>
                <li>Handling customer refund requests in accordance with stated policies</li>
                <li>Not listing prohibited or illegal goods on the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Platform Liability</h2>
              <p className="leading-relaxed">
                RelaxShopping acts as a marketplace facilitator. We are not the seller of record for products listed by vendors. Accordingly:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>We are not liable for the quality, safety, or legality of products listed by vendors</li>
                <li>We are not liable for delivery delays caused by circumstances outside our control (e.g., traffic, weather, force majeure)</li>
                <li>Our liability for any claim arising from use of the platform is limited to the value of the specific transaction in question</li>
                <li>We are not responsible for WhatsApp communications between users, staff, or vendors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal data for as long as your account is active or as needed to provide services. If you request account deletion, we will remove or anonymise your data within 30 days, except where we are required to retain it by law (e.g., financial transaction records).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy or how your data is handled, please contact us:
              </p>
              <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <p><strong>Email:</strong> <a href="mailto:relaxxshopping@gmail.com" className="text-[#2d7a2d] hover:underline">relaxxshopping@gmail.com</a></p>
                <p><strong>Phone:</strong> <a href="tel:+2347071175566" className="text-[#2d7a2d] hover:underline">+234 707 117 5566</a></p>
              </div>
            </section>

          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/terms-and-conditions" className="text-[#2d7a2d] hover:underline font-medium">View Terms & Conditions</Link>
          {" · "}
          <Link href="/" className="text-[#2d7a2d] hover:underline font-medium">Return to Home</Link>
        </div>
      </main>

      <footer className="mt-10 bg-gray-900 text-gray-400 text-sm text-center py-5">
        © 2026 RelaxShopping. All rights reserved.
      </footer>
    </div>
  );
}
