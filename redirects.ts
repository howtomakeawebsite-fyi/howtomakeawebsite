/**
 * Redirects: when an old web address should send visitors to a new one.
 * Useful when you move from an old website, so old links and Google results keep working.
 *
 * To add one, copy the example line and change the two addresses.
 *   source      = the OLD address (the part after your domain name)
 *   destination = the NEW address on this site
 *   permanent   = true tells Google the move is for good
 */
export const redirects: { source: string; destination: string; permanent: boolean }[] = [
  // Example: an old site's "/contact-us" page now lives at "/contact/".
  { source: "/contact-us", destination: "/contact/", permanent: true },
  // { source: "/our-old-page", destination: "/about/", permanent: true },
];
