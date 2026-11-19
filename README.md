# Church Starter

A simple, good-looking church website that you can copy and make your own.

Everything you see on it is a **sample**: "Your Church Name", "Sample Pastor", "123 Sample Street" and so on. You replace the samples with your own church's details. You do not need to know how to code.

## What you get

| Page | Address | What it shows |
|---|---|---|
| Home | `/` | Welcome, service time, "Plan your visit" button, latest sermon, upcoming events, a verse |
| About | `/about/` | Who we are, what we believe, leadership |
| Plan Your Visit | `/plan-your-visit/` | Times, address, map, what to expect |
| Sermons | `/sermons/` | Your YouTube videos with a series filter, a countdown to the next service and the live stream when you are live (a friendly sample until you add your channel ID) |
| Podcast | `/podcast/` | Spotify and Apple Podcasts players and the latest episodes (set them in Church settings, Podcast) |
| FAQ | `/faq/` | Questions and answers, with the structured data Google and AI assistants read |
| Get our app | `/get-our-app/` | How to save the site to a phone's home screen, with an Install button where the phone offers it |
| Notifications | `/notifications/` | Turn notifications on and choose topics (needs the notification settings below) |
| Events | `/events/` | Events from your calendar (sample events until you add your calendar link) |
| Give | `/give/` | Bank details with a Copy button |
| Contact | `/contact/` | Phone, email, contact form |
| Prayer | `/prayer/` | Prayer request form |
| Privacy Policy | `/privacy-policy/` | Generic sample wording marked "Edit me" |
| Send a notification | `/notifications-admin/` | Private page for leaders, protected by a password. Not in any menu or search engine |
| Page not found | any wrong address | A friendly 404 page |

Also built in:

- **Light and dark mode**, and a layout that works on phones, tablets and computers.
- **Contact and prayer forms** that email your church (through a service called Resend), with spam protection.
- **"Verify you are human" check** (Cloudflare Turnstile) on both forms. It stays off until you add its keys.
- **Security headers** (rules that tell browsers to block unsafe things) in `next.config.ts`.
- **Search engine basics**: a sitemap, `robots.txt`, `llms.txt` for AI assistants, and structured data that tells Google this is a church.
- **Installable app**: visitors can save the site to their phone like an app.
- **Site search**, an "Add to calendar" button, and a redirects file (`redirects.ts`) with an example.
- **Phone notifications**: a bell at the top of every page and an invitation on the home page, once the notification settings are added.
- **"Live now" banner** at the top of every page while your YouTube channel is live.
- **IndexNow**: a key file in `public/` and `npm run indexnow`, to tell Bing straight away that pages have changed.
- **Share this page** button with your own hashtags (Church settings, Share hashtags).

## How to copy it

1. Sign in to GitHub (the website that stores your site's files).
2. Open this template's page on GitHub and click **Use this template**, then **Create a new repository**.
3. Give it a name, for example `our-church-website`, and click **Create repository**.

You now have your own copy. Changes you make to your copy do not affect anyone else.

## How to edit it with Pages CMS

Pages CMS is a free editor that runs in your browser. It turns the files into simple forms.

1. Go to `https://app.pagescms.org` and sign in with your GitHub account.
2. Choose your website's repository.
3. In the menu on the left you will see:
   - **Church settings**: name, address, phone, email, service time, bank details, YouTube channel ID, calendar link, social links.
   - **Home page**: the words on the home page.
   - **Team**: your leaders.
   - **Pages**: About, Plan Your Visit, Events, Give, Contact, Prayer, Privacy Policy.
4. Change something and click **Save**. Your site rebuilds by itself in about a minute.

Tips:

- Search every page for the words **Edit me** and replace that text with your own.
- In a page's text you will see lines such as `<ContactForm />` or `<MapEmbed />`. These are ready-made blocks. Leave them exactly as they are, or delete the whole line to remove the block.
- No Pages CMS? You can also edit the same files straight on GitHub: open a file in the `content` folder and click the pencil icon.

### Where things live

| What | File |
|---|---|
| Church details | `content/settings.json` |
| Home page words | `content/home.json` |
| Team | `content/team.json` |
| FAQ | `content/faq.json` |
| Sermon extras (series, speaker, topics, notes or hide, per video) | `content/sermons.json` |
| Pages | `content/pages/*.mdx` (the file name is the page address: `about.mdx` is `/about/`) |
| Menu | `src/config/site.ts` |
| Colours | the lines starting with `--brand-` at the top of `src/app/globals.css` |
| Logo | `public/brand/logo-mark.svg` (replace it, keep the name, then run `npm run icons`) |
| Old addresses that should go to new pages | `redirects.ts` |

### Blocks you can use in a page

| Block | What it shows |
|---|---|
| `<ServiceInfo />` | Service time and place, with buttons |
| `<MapEmbed />` | Google map (set "Map search words" in Church settings) |
| `<TeamGrid />` | Your team |
| `<EventsCalendar />` | Upcoming events |
| `<BankDetails />` | Bank details with a Copy button |
| `<ContactDetails />` | Email, phone, address |
| `<ContactForm />` | Contact form |
| `<PrayerForm />` | Prayer request form |
| `<YouTube id="..." title="..." />` | One YouTube video |
| `<Scripture reference="..." version="..." text="..." />` | A Bible verse |
| `<EditMe title="...">...</EditMe>` | A dashed "sample text" reminder box |
| `<PodcastPlayers />` | The Spotify and Apple Podcasts players side by side |
| `<PodcastEpisodes />` | The latest podcast episodes, each with a play button |
| `<AppSetupSteps />` | The three steps to save the app and turn on notifications |
| `<NotificationsButton />` | The Turn on notifications box |

## Settings to add where your site is hosted (environment variables)

These are private settings. They are **not** stored in the files. You add them in your hosting account (on Vercel: Project, then Settings, then Environment Variables). The site works without any of them. `.env.example` lists the names.

| Name | What it is for | Needed? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your website's address, for example `https://yourchurch.example`. If empty, the address in Church settings is used. | Optional |
| `RESEND_API_KEY` | The key from Resend that lets the forms send email. | For forms |
| `CONTACT_TO_EMAIL` | The inbox that receives contact and prayer messages. | For forms |
| `CONTACT_FROM_EMAIL` | The sender address, on a domain you have verified in Resend. | For forms |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile "site key" (shows the human check box). | Optional, recommended |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile "secret key" (checks the answer on the server). | Optional, recommended |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` | Your YouTube channel ID. You can set it in Church settings instead. | Optional |
| `EVENTS_ICS_URL` | Your calendar's public iCal link. You can set it in Church settings instead. | Optional |
| `YOUTUBE_API_KEY` | A YouTube Data API key, for exact video dates. The Sermons page works without it. | Optional |
| `GOOGLE_SITE_VERIFICATION` | The code Google Search Console gives you to prove the site is yours. | Optional |
| `BING_SITE_VERIFICATION` | The same, for Bing Webmaster Tools. | Optional |
| `KV_REST_API_URL` | Upstash Redis address. Vercel adds it when you connect Upstash for Redis from the Storage tab. | For notifications |
| `KV_REST_API_TOKEN` | Upstash Redis key. Added by Vercel together with the one above. | For notifications |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | The public notification key. Make the pair once with `npm run vapid`. | For notifications |
| `VAPID_PRIVATE_KEY` | The private notification key (mark it Sensitive). Never change the pair later. | For notifications |
| `VAPID_SUBJECT` | `mailto:` and your church email, for example `mailto:office@yourchurch.example`. | For notifications |
| `PUSH_ADMIN_PASSWORD` | Password for `/notifications-admin/` (mark it Sensitive, at least 8 characters). | For notifications |

Until all six notification settings are added and the site is redeployed, the bell and the home page invitation stay hidden and the Notifications page says "Notifications are coming soon".

Until the three form settings are added, the forms still show, and a visitor who presses Send sees: "Form email is not set up yet". Nothing breaks.

Never put keys or passwords in a file on GitHub. Save them in your password manager.

## Running it on your own computer (optional)

You need Node.js version 20.9 or newer.

```
npm install
npm run dev
```

Then open `http://localhost:3000`. Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Builds the site the way your host does. Run it to check nothing is broken. |
| `npm run start` | Shows the built site. |
| `npm run check` | Checks the settings files, page titles and descriptions, and that colours are easy to read. |
| `npm run icons` | Remakes the app icons and share picture after you change the logo. |
| `npm run vapid` | Makes the notification key pair (once only). |
| `npm run indexnow` | Tells Bing about every page in your sitemap. Add page addresses to send only those: `npm run indexnow -- /faq/`. Makes a key file first if there is none. |
| `npm run indexnow:key` | Shows your IndexNow key and the address to paste into your browser to send your home page by hand. |

## Add-ons covered later

To keep this starter simple, these are left out. They are covered later in the course:

- Announcements
- Daily devotionals
- Translations into other languages
- Online courses and downloadable study material
- Questionnaires and sign-up forms with limited places
- Google Forms on the site
- A blog
- A question-and-answer helper
- Scheduled jobs (tasks that run by themselves at set times)

## Pictures and fonts

See `IMAGE-CREDITS.md`. All pictures are original drawings made for this template. Only add photos you have permission to use.
