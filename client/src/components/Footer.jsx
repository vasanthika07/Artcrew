import { Link } from 'react-router-dom';
import { Palette, Share2, MessageCircle, PlayCircle, Mail, ArrowRight } from 'lucide-react';

const footerLinks = {
  Explore: [
    { to: '/mediums',   label: 'Art Mediums' },
    { to: '/gallery',   label: 'Gallery' },
    { to: '/studios',   label: 'Find Studios' },
    { to: '/assistant', label: 'AI Advisor' },
  ],
  Learn: [
    { to: '/live-sessions',     label: 'Live Sessions' },
    { to: '/recorded-sessions', label: 'Workshops' },
    { to: '/subscriptions',     label: 'Pricing Plans' },
    { to: '/account',           label: 'My Account' },
  ],
};

const Footer = () => (
  <footer className="bg-charcoal-950 text-charcoal-300" aria-label="Site footer">

    {/* Newsletter strip */}
    <div className="border-b border-charcoal-800">
      <div className="container-art py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="font-display font-semibold text-white text-lg mb-1">Stay in the creative loop</p>
            <p className="text-charcoal-500 text-sm">New mediums, workshops, and studio discoveries — weekly.</p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 w-full sm:w-auto"
            aria-label="Newsletter signup"
          >
            <input
              type="email"
              placeholder="your@email.com"
              aria-label="Email address for newsletter"
              className="input-dark flex-1 sm:w-56 text-sm"
            />
            <button
              type="submit"
              className="btn-primary btn-sm shrink-0"
              aria-label="Subscribe to newsletter"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>

    {/* Main footer grid */}
    <div className="container-art py-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 mb-4 group" aria-label="ArtCrew home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center shadow-art group-hover:shadow-art-lg transition-shadow">
              <Palette className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-lg text-white">ArtCrew</span>
          </Link>
          <p className="text-sm text-charcoal-500 leading-relaxed mb-5">
            Discover your art medium, find local studios, and learn from expert artists across India.
          </p>
          <div className="flex gap-2.5">
            {[
              { Icon: Share2,         label: 'Instagram' },
              { Icon: MessageCircle,  label: 'Twitter' },
              { Icon: PlayCircle,     label: 'YouTube' },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={`ArtCrew on ${label}`}
                className="w-9 h-9 rounded-xl bg-charcoal-800 hover:bg-canvas-500 flex items-center justify-center transition-all duration-200 hover:shadow-art group"
              >
                <Icon className="w-4 h-4 text-charcoal-400 group-hover:text-white transition-colors" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {Object.entries(footerLinks).map(([section, links]) => (
          <div key={section}>
            <h4 className="text-white font-semibold text-xs uppercase tracking-[0.12em] mb-4">
              {section}
            </h4>
            <ul className="space-y-2.5" role="list">
              {links.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-charcoal-400 hover:text-canvas-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold text-xs uppercase tracking-[0.12em] mb-4">
            Contact
          </h4>
          <a
            href="mailto:hello@artcrew.in"
            className="flex items-center gap-2 text-sm text-charcoal-400 hover:text-canvas-400 transition-colors mb-4"
            aria-label="Email ArtCrew support"
          >
            <Mail className="w-4 h-4 shrink-0" aria-hidden="true" /> hello@artcrew.in
          </a>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Designed & built with ❤️<br />for the Indian art community.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-charcoal-800/60 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-charcoal-600">
          © {new Date().getFullYear()} ArtCrew Technologies Pvt. Ltd. All rights reserved.
        </p>
        <div className="flex gap-5 text-xs text-charcoal-600">
          <a href="#" className="hover:text-charcoal-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-charcoal-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-charcoal-400 transition-colors">Refund Policy</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
