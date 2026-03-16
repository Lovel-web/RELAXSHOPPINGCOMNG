import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsAndConditions() {
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
          <div className="bg-gradient-to-r from-[#1a3a5c] to-[#2d5f8a] px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-8 w-8 opacity-80" />
              <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Legal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Terms & Conditions</h1>
            <p className="text-blue-100 text-sm">Last updated: March 2026</p>
          </div>

          <div className="px-8 py-10 text-gray-700 space-y-8">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. User Agreement</h2>
              <p className="leading-relaxed">
                By accessing and using the RelaxShopping platform ("Platform"), you agree to be bound by these Terms and Conditions. These terms govern your use of our website, services, and all associated features including vendor listings, order placement, delivery tracking, and WhatsApp community integration.
              </p>
              <p className="leading-relaxed mt-3">
                If you do not accept these terms, you must immediately cease using the Platform. RelaxShopping reserves the right to update these terms at any time, and continued use of the Platform after changes constitutes acceptance of the updated terms.
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
                <p className="text-sm text-amber-800 font-medium">You must be at least 18 years old to use RelaxShopping or have parental consent if you are a minor.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Vendor Agreement</h2>
              <p className="leading-relaxed">Vendors using RelaxShopping agree to the following:</p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm leading-relaxed">
                <li>Vendors must undergo administrative approval before listing products. Approval may be revoked at any time for violations of these terms.</li>
                <li>Vendors are solely responsible for the accuracy, legality, and quality of all products listed on the Platform.</li>
                <li>Vendors must provide a valid bank account for payment disbursement. Payment settlements are issued based on confirmed deliveries only.</li>
                <li>Vendors may only list products within their approved LGA coverage area.</li>
                <li>Vendors must ensure product stock counts are up to date. Listing products known to be out of stock is a violation.</li>
                <li>RelaxShopping retains a platform fee on all vendor sales, the rate of which is communicated during the onboarding process.</li>
                <li>Vendors may not engage in price manipulation, fraudulent listing, or any practice designed to harm customers or other vendors.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Delivery Terms</h2>
              <p className="leading-relaxed">The following terms govern order delivery on the Platform:</p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm leading-relaxed">
                <li>Deliveries are organised into scheduled batch time slots (e.g., 10 AM, 1 PM, 4 PM) based on when orders are placed and batch availability.</li>
                <li>Orders are delivered by approved local staff members assigned to specific LGAs. Customers will be notified via WhatsApp when their order is dispatched.</li>
                <li>Delivery fees are calculated at checkout and are non-refundable once an order has been dispatched.</li>
                <li>RelaxShopping is not liable for delays caused by factors outside our control including but not limited to: traffic conditions, adverse weather, or vendor unavailability.</li>
                <li>Orders must be received at the registered estate address. Customers who are unavailable at the time of delivery must arrange an alternative with the delivery staff directly.</li>
                <li>RelaxShopping reserves the right to adjust delivery schedules during public holidays or periods of high demand.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Payment Terms</h2>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm leading-relaxed">
                <li>All payments must be made through the Platform using Paystack. Cash payments are not accepted.</li>
                <li>Orders are created and confirmed only after payment is successfully verified through Paystack. Do not close the payment window until you receive a confirmation.</li>
                <li>Prices displayed are in Nigerian Naira (₦) and are inclusive of all applicable taxes unless otherwise stated.</li>
                <li>Vendor settlements are issued on a per-delivery basis after orders are marked as delivered by staff and verified by the Platform.</li>
                <li>RelaxShopping does not store payment card details. All card transactions are processed directly by Paystack under PCI-DSS compliance standards.</li>
                <li>In cases of payment failure, the customer's funds will be reversed by Paystack in accordance with their refund timelines (typically 3–5 business days).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Refund & Returns Policy</h2>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm leading-relaxed">
                <li>Refund requests must be raised within 24 hours of delivery by contacting RelaxShopping support or the vendor directly.</li>
                <li>Refunds are subject to vendor policies and are only granted for items that are: damaged upon delivery, significantly different from what was ordered, or not delivered.</li>
                <li>Delivery fees are non-refundable once the delivery process has been initiated.</li>
                <li>Approved refunds are processed back to the original payment method within 5–10 business days.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Dispute Resolution</h2>
              <p className="leading-relaxed">
                In the event of a dispute between a customer and vendor, both parties are encouraged to first attempt to resolve the matter directly. If resolution cannot be reached:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm leading-relaxed">
                <li>Either party may escalate the dispute to RelaxShopping support via email at <a href="mailto:relaxxshopping@gmail.com" className="text-[#2d7a2d] hover:underline">relaxxshopping@gmail.com</a>.</li>
                <li>RelaxShopping will act as a neutral mediator and will review transaction records, order history, and communications to make a fair determination.</li>
                <li>RelaxShopping's decision in disputes is final and binding on both parties.</li>
                <li>Any legal claims arising from use of the Platform shall be governed by the laws of the Federal Republic of Nigeria.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Acceptable Use Policy</h2>
              <p className="leading-relaxed">Users of RelaxShopping must not engage in any of the following:</p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm leading-relaxed">
                <li>Listing or purchasing illegal, counterfeit, or prohibited goods</li>
                <li>Impersonating another person or business entity</li>
                <li>Attempting to bypass or interfere with the Platform's security systems</li>
                <li>Using the Platform to send unsolicited commercial communications (spam)</li>
                <li>Engaging in fraudulent transactions or chargebacks without valid cause</li>
                <li>Sharing account credentials or allowing unauthorised access to your account</li>
                <li>Using bots, scrapers, or automated tools to access Platform data without permission</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Violation of this Acceptable Use Policy may result in immediate suspension or permanent ban from the Platform, and may be reported to relevant authorities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Staff Terms</h2>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm leading-relaxed">
                <li>Staff members are approved on a per-LGA basis and may only fulfill orders within their assigned LGA.</li>
                <li>Staff are responsible for collecting items from vendors accurately and delivering them to the correct estate address.</li>
                <li>Any misconduct, theft, or negligence by staff will result in immediate removal from the Platform and may be reported to authorities.</li>
                <li>Staff member settlements are managed by the Platform based on completed, verified deliveries.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the fullest extent permitted by applicable law, RelaxShopping shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability for any direct claim shall not exceed the value of the specific transaction giving rise to such claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact</h2>
              <p className="leading-relaxed">For questions about these Terms & Conditions, please contact:</p>
              <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <p><strong>Email:</strong> <a href="mailto:relaxxshopping@gmail.com" className="text-[#2d7a2d] hover:underline">relaxxshopping@gmail.com</a></p>
                <p><strong>Phone:</strong> <a href="tel:+2347071175566" className="text-[#2d7a2d] hover:underline">+234 707 117 5566</a></p>
              </div>
            </section>

          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/privacy-policy" className="text-[#2d7a2d] hover:underline font-medium">View Privacy Policy</Link>
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
