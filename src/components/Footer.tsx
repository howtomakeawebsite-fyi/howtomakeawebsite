import Link from "next/link";
import { footerLinks, site } from "@/config/site";
import { Icon } from "./Icon";
import { InstallAppButton } from "./Pwa";

/** Footer on every page. All details come from the church settings (content/settings.json). */
export function Footer() {
  return (
    <footer className="mt-24 bg-deep-oak text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-display text-2xl font-bold">{site.name}</p>
          <p className="font-display text-lg">Join us: {site.service.label}</p>
          <address className="not-italic text-[#e9dcc3]">
            {site.venue.name}<br />
            {site.addressLine}
          </address>
          {site.mapsLink && (
            <a href={site.mapsLink} className="inline-flex items-center gap-2 font-semibold text-[#f2d9ac] underline-offset-4 hover:underline" target="_blank" rel="noopener">
              <Icon name="map" className="h-4 w-4" /> Open in Google Maps
            </a>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl">Get in touch</h2>
          <ul className="mt-3 space-y-2 text-[#e9dcc3]">
            <li><a className="hover:text-cream hover:underline" href={`mailto:${site.email}`}>{site.email}</a></li>
            <li>Phone <a className="font-semibold hover:underline" href={site.phoneHref}>{site.phone}</a></li>
          </ul>
          {site.social.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-xl">Follow us</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {site.social.map((s) => (
                  <li key={s.name}>
                    <a href={s.href} target="_blank" rel="noopener" className="inline-block rounded-full border border-[#6b5235] px-3 py-1.5 text-sm text-[#e9dcc3] transition-colors hover:border-[#f2d9ac] hover:text-cream">{s.name}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl">Quick links</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[#e9dcc3]">
            {footerLinks.map((l) => (
              <li key={l.href}><Link className="hover:text-cream hover:underline" href={l.href}>{l.label}</Link></li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/give/" className="btn btn-light"><Icon name="gift" className="h-4 w-4" /> Give</Link>
            <InstallAppButton className="btn border border-[#6b5235] text-cream hover:border-[#f2d9ac]" />
          </div>
        </div>
      </div>
      <div className="border-t border-[#5a4329]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-[#d9c8a8] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Copyright &copy; {site.name}. All rights reserved.</p>
          <p>
            Built with the How to Make a Website course:{" "}
            <a href="https://www.wiseintegrate.com" target="_blank" rel="noopener" className="font-semibold text-[#f2d9ac] underline underline-offset-4 hover:text-cream">wiseintegrate.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
