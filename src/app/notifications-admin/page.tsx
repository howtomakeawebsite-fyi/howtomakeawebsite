import type { Metadata } from "next";
import { NotificationsAdmin } from "./NotificationsAdmin";

// Private page for church leaders. Not in any menu or the sitemap, never shown in Google, and useless without the password.
export const metadata: Metadata = {
  title: "Send a notification",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function NotificationsAdminPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-semibold">Send a notification</h1>
      <p className="mt-3 text-muted">
        This sends a notification to every phone and computer that has turned notifications on and kept the chosen topic switched on. Messages sent here go at once. After five wrong passwords, this page locks for 15 minutes.
      </p>
      <NotificationsAdmin />
    </div>
  );
}
