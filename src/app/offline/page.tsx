import Link from "next/link";
import { site } from "@/config/site";

export const metadata = { title: "Offline", robots: { index: false } };

/** Shown by the installed app when the phone has no internet. */
export default function Offline() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold">You&rsquo;re offline</h1>
      <p className="mt-4 text-lg text-muted">This page isn&rsquo;t saved on your device yet. Reconnect to the internet and try again.</p>
      <div className="mt-8 rounded-3xl border border-line bg-panel p-6 text-left">
        <p className="font-semibold">Join us</p>
        <p>{site.service.label}, {site.venue.name}, {site.addressLine}</p>
        <p className="mt-2">Phone {site.phone}</p>
      </div>
      <Link href="/" className="btn btn-primary mt-8">Try the home page</Link>
    </section>
  );
}
