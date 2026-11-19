import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { NotificationsButton } from "@/components/PushNotifications";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Notifications",
  description: `Turn on notifications from ${site.name}: the Thought for the Day and church announcements. Choose which you want, and switch them off at any time.`,
  path: "/notifications/",
  keywords: ["church notifications", "church app", "church announcements"],
});

/** The one easy place to turn notifications on and choose topics. The bell at the top of every page leads here. */
export default function NotificationsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Notifications", path: "/notifications/" }])} />
      <PageHero eyebrow="Stay in touch" title="Notifications" intro="One tap and you will get the Thought for the Day and church announcements on this phone or computer." crumbs={[{ label: "Notifications", href: "/notifications/" }]} />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <NotificationsButton />
        <div className="space-y-3 text-muted">
          <p><strong className="text-ink">How it works:</strong> tap <strong className="text-ink">Turn on notifications</strong>, then tap <strong className="text-ink">Allow</strong> when your phone asks. Both topics are switched on; switch off anything you do not want. You can change this, or turn notifications off, at any time on this page.</p>
          <p><strong className="text-ink">iPhone or iPad:</strong> Apple only allows notifications from the app on your Home Screen. Add this website to your Home Screen first (<Link href="/get-our-app/" className="font-semibold text-accent underline underline-offset-4">show me how</Link>), open it from there, come back to this page and tap Turn on notifications.</p>
          <p>We never ask for your name or email for notifications, we do not send them at night, and we send no more than one a day.</p>
        </div>
      </section>
    </>
  );
}
