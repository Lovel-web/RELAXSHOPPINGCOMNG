import { useState } from "react";
import { Link } from "wouter";
import {
  ShoppingBag, Store, Users, LogIn, MapPin, Shield, MessageCircle,
  Truck, Package, Globe, ChevronDown, ChevronUp, Facebook, Twitter,
  Instagram, Linkedin, Phone, Mail, Menu, X, Check, ArrowRight
} from "lucide-react";

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-rs.jpg" alt="RelaxShopping" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-extrabold text-lg hidden sm:block">
              <span className="text-[#2d7a2d]">Relax</span>
              <span className="text-[#e07b00]">Shopping</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-[#2d7a2d] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#2d7a2d] transition-colors">Features</a>
            <a href="#vendors" className="hover:text-[#2d7a2d] transition-colors">Vendors</a>
            <a href="#faq" className="hover:text-[#2d7a2d] transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/join">
              <button className="bg-[#2d7a2d] hover:bg-[#245e24] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Join as Customer
              </button>
            </Link>
            <Link href="/vendor-signup">
              <button className="border border-[#2d7a2d] text-[#2d7a2d] hover:bg-[#2d7a2d] hover:text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Become a Vendor
              </button>
            </Link>
            <Link href="/login">
              <button className="flex items-center gap-1 text-gray-600 hover:text-[#2d7a2d] text-sm font-medium px-3 py-2 transition-colors">
                <LogIn className="h-4 w-4" /> Login
              </button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <a href="#how-it-works" onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-700 py-2 border-b border-gray-50">How It Works</a>
          <a href="#features" onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-700 py-2 border-b border-gray-50">Features</a>
          <a href="#vendors" onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-700 py-2 border-b border-gray-50">Vendors</a>
          <a href="#faq" onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-700 py-2 border-b border-gray-50">FAQ</a>
          <div className="pt-2 space-y-2">
            <Link href="/join" onClick={() => setOpen(false)}>
              <button className="w-full bg-[#2d7a2d] text-white text-sm font-semibold px-4 py-2.5 rounded-lg">Join as Customer</button>
            </Link>
            <Link href="/vendor-signup" onClick={() => setOpen(false)}>
              <button className="w-full border border-[#2d7a2d] text-[#2d7a2d] text-sm font-semibold px-4 py-2.5 rounded-lg">Become a Vendor</button>
            </Link>
            <Link href="/staff-signup" onClick={() => setOpen(false)}>
              <button className="w-full border border-gray-300 text-gray-600 text-sm font-semibold px-4 py-2.5 rounded-lg">Apply as Staff</button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <button className="w-full flex items-center justify-center gap-2 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200">
                <LogIn className="h-4 w-4" /> Login
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f0faf0] via-white to-[#fff8f0] py-20 sm:py-28">
      <div className="absolute inset-0 pointer-events-none select-none opacity-10">
        <ShoppingBag className="absolute top-10 left-10 h-24 w-24 text-[#2d7a2d] rotate-12" />
        <Package className="absolute bottom-10 right-16 h-20 w-20 text-[#e07b00] -rotate-12" />
        <Truck className="absolute top-1/2 right-6 h-16 w-16 text-[#2d7a2d]" />
        <Store className="absolute bottom-16 left-16 h-16 w-16 text-[#e07b00] rotate-6" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo-rs.jpg" alt="RelaxShopping Logo" className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover shadow-lg ring-4 ring-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Shop Smarter<br />
          <span className="text-[#2d7a2d]">In Your Estate.</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          RelaxShopping connects customers, local vendors, and delivery staff within your estate through a geo-organised WhatsApp community system.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/shop">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2d7a2d] hover:bg-[#245e24] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-md hover:shadow-lg">
              <ShoppingBag className="h-5 w-5" /> Browse Products
            </button>
          </Link>
          <Link href="/join">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#2d7a2d] text-[#2d7a2d] hover:bg-[#2d7a2d] hover:text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all">
              <Users className="h-5 w-5" /> Join Your LGA
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

const steps = [
  { num: 1, icon: MapPin, title: "Join Your Area", desc: "Select your State and LGA and join the official WhatsApp group for your community.", color: "bg-[#e8f5e8] text-[#2d7a2d]" },
  { num: 2, icon: ShoppingBag, title: "Browse Products", desc: "View products from verified vendors serving your area — filtered exactly to your LGA.", color: "bg-[#fff3e0] text-[#e07b00]" },
  { num: 3, icon: Shield, title: "Place Order", desc: "Select your estate, pay securely using Paystack, and get an order code instantly.", color: "bg-[#e8f5e8] text-[#2d7a2d]" },
  { num: 4, icon: Truck, title: "Receive Delivery", desc: "Your order is delivered to your estate by local delivery staff in organised batches.", color: "bg-[#fff3e0] text-[#e07b00]" },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#e8f5e8] text-[#2d7a2d] text-sm font-semibold px-4 py-1.5 rounded-full mb-3">Simple Process</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">How It Works</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">From joining your community to receiving your order — four easy steps.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="relative flex flex-col items-center text-center group">
                <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${s.color} mb-5 shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 -right-2 sm:hidden lg:block bg-gray-900 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Store, title: "Local Vendor Marketplace", desc: "Support vendors operating within your Local Government Area. Every sale stays local.", color: "text-[#2d7a2d] bg-[#e8f5e8]" },
  { icon: Truck, title: "Estate Delivery System", desc: "Orders are grouped and delivered efficiently to estate zones by trained local staff.", color: "text-[#e07b00] bg-[#fff3e0]" },
  { icon: Shield, title: "Secure Payments", desc: "All payments are processed through Paystack — Nigeria's most trusted payment gateway.", color: "text-[#2d7a2d] bg-[#e8f5e8]" },
  { icon: MessageCircle, title: "WhatsApp Order Updates", desc: "Customers receive real-time delivery updates through dedicated WhatsApp community groups.", color: "text-[#e07b00] bg-[#fff3e0]" },
  { icon: Package, title: "Smart Vendor Pickup", desc: "Staff collect items from multiple vendors in organised batches — reducing delays and errors.", color: "text-[#2d7a2d] bg-[#e8f5e8]" },
  { icon: Globe, title: "Geo-Locked Marketplace", desc: "Customers only see vendors available in their LGA — no irrelevant listings, no confusion.", color: "text-[#e07b00] bg-[#fff3e0]" },
];

function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#fff3e0] text-[#e07b00] text-sm font-semibold px-4 py-1.5 rounded-full mb-3">Platform Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Platform Features</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">Everything you need for a smooth local marketplace experience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${f.color} mb-4 group-hover:scale-105 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function VendorSpotlight() {
  const benefits = [
    "Reach customers directly in your LGA",
    "Receive secure payments via Paystack",
    "Join structured batch delivery schedules",
    "Expand your customer base effortlessly",
  ];
  return (
    <section id="vendors" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-[#1a5c1a] to-[#2d7a2d] overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-10 sm:p-14 flex flex-col justify-center">
              <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6 w-fit">For Vendors</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
                Grow Your Local Business With RelaxShopping
              </h2>
              <p className="text-green-100 text-base leading-relaxed mb-8">
                RelaxShopping enables vendors to sell directly to customers within their Local Government Area through an organised marketplace and WhatsApp commerce system.
              </p>
              <ul className="space-y-3 mb-10">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-white">
                    <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/vendor-signup">
                <button className="w-fit flex items-center gap-2 bg-[#e07b00] hover:bg-[#c96d00] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-md">
                  Become a Vendor <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center p-10 bg-white/5">
              <div className="text-center">
                <img src="/logo-rs.jpg" alt="RelaxShopping" className="h-40 w-40 rounded-full object-cover mx-auto shadow-2xl ring-4 ring-white/30 mb-6" />
                <p className="text-green-100 text-sm font-medium">Trusted by local vendors across Nigeria</p>
                <div className="mt-4 flex justify-center gap-4">
                  <div className="text-center">
                    <p className="text-white text-2xl font-extrabold">LGA</p>
                    <p className="text-green-200 text-xs">Coverage</p>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-white text-2xl font-extrabold">100%</p>
                    <p className="text-green-200 text-xs">Secure Pay</p>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-white text-2xl font-extrabold">Local</p>
                    <p className="text-green-200 text-xs">Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "What is RelaxShopping?", a: "RelaxShopping is a local marketplace that connects customers with vendors within their Local Government Area (LGA). It is designed to bring the supermarket experience to your doorstep through organised estate delivery." },
  { q: "How do I join?", a: "Simply click 'Join as Customer', select your State and LGA, and join the official WhatsApp group for your area. You'll be able to browse and order from local vendors immediately." },
  { q: "How do deliveries work?", a: "Orders are grouped by estate and fulfilled through a local delivery staff network. Staff pick up items from vendors in organised batches and deliver directly to your estate zone." },
  { q: "Are payments secure?", a: "Yes. All payments are processed through Paystack, Nigeria's leading and most trusted payment gateway. Your financial information is never stored on our servers." },
  { q: "Can vendors join?", a: "Absolutely. Vendors can apply through our vendor signup page. After administrative approval, you'll be able to list products and start selling to customers in your LGA." },
];

function FAQ() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#e8f5e8] text-[#2d7a2d] text-sm font-semibold px-4 py-1.5 rounded-full mb-3">Got Questions?</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between text-left px-6 py-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => setActive(active === i ? null : i)}
              >
                <span className="pr-4">{f.q}</span>
                {active === i ? <ChevronUp className="h-5 w-5 text-[#2d7a2d] flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />}
              </button>
              {active === i && (
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TermsSummary() {
  const points = [
    "Orders must be placed through the RelaxShopping platform.",
    "Deliveries are organised by estate batches and fulfilled by approved local staff.",
    "Vendors are responsible for product quality and accuracy of listings.",
    "Refund policies are handled according to each vendor's stated policies.",
  ];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="border border-gray-200 rounded-2xl p-8 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Terms & Conditions Summary</h2>
          <p className="text-sm text-gray-500 mb-5">A brief summary of our key policies. Please read the full terms before using the platform.</p>
          <ul className="space-y-3 mb-6">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="h-4 w-4 mt-0.5 text-[#2d7a2d] flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
          <Link href="/terms-and-conditions">
            <button className="text-sm font-semibold text-[#2d7a2d] hover:underline flex items-center gap-1">
              View Full Terms & Conditions <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#f0faf0] to-[#fff8f0]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <img src="/logo-rs.jpg" alt="RelaxShopping" className="h-16 w-16 rounded-full object-cover mx-auto mb-6 shadow-md" />
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Start Shopping In Your Estate Today
        </h2>
        <p className="text-gray-500 mb-10 text-base">Join thousands of customers already shopping smarter within their local communities.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/join">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2d7a2d] hover:bg-[#245e24] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-md">
              <Users className="h-5 w-5" /> Join as Customer
            </button>
          </Link>
          <Link href="/shop">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#2d7a2d] text-[#2d7a2d] hover:bg-[#2d7a2d] hover:text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all">
              <ShoppingBag className="h-5 w-5" /> Browse Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-rs.jpg" alt="RelaxShopping" className="h-10 w-10 rounded-full object-cover" />
              <span className="font-extrabold text-lg text-white">
                <span className="text-[#4caf50]">Relax</span>
                <span className="text-[#ff9800]">Shopping</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-5">
              Bringing the supermarket to your doorstep through geo-organised, community-driven local delivery.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#4caf50]" />
                <a href="mailto:rellaxshopping@gmail.com" className="hover:text-white transition-colors">rellaxshopping@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#4caf50]" />
                <a href="tel:+2347071175566" className="hover:text-white transition-colors">+234 707 117 5566</a>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="h-9 w-9 rounded-full bg-gray-800 hover:bg-[#4caf50] flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-gray-800 hover:bg-[#4caf50] flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-gray-800 hover:bg-[#4caf50] flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-gray-800 hover:bg-[#4caf50] flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://wa.me/2347071175566" className="h-9 w-9 rounded-full bg-gray-800 hover:bg-[#25D366] flex items-center justify-center transition-colors" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Mission</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="mailto:rellaxshopping@gmail.com" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Local Marketplace</a></li>
              <li><Link href="/vendor-signup" className="hover:text-white transition-colors">Vendor Platform</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Estate Delivery Network</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© 2026 RelaxShopping. All rights reserved.</p>
          <p>Designed for Nigerian communities. Powered by Paystack.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <Features />
        <VendorSpotlight />
        <FAQ />
        <TermsSummary />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
