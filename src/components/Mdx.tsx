import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import type { Root, Heading } from "mdast";
import Link from "next/link";
import type { ComponentProps } from "react";
import { BankDetails } from "./BankDetails";
import { ContactForm } from "./ContactForm";
import { PrayerForm } from "./PrayerForm";
import { EventsCalendar } from "./EventsCalendar";
import { ServiceInfo, MapEmbed, EditMe, YouTube, Scripture, TeamGrid, ContactDetails } from "./ContentBlocks";

function Img({ src = "", alt = "", title }: ComponentProps<"img">) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={String(src)} alt={alt} title={title} loading="lazy" decoding="async" />;
}

function A({ href = "", children, ...rest }: ComponentProps<"a">) {
  const h = String(href);
  if (h.startsWith("/") && !/\.(pdf|xlsx?|docx?)$/i.test(h)) return <Link href={h} {...rest}>{children}</Link>;
  const external = /^https?:\/\//.test(h);
  return <a href={h} {...rest} {...(external ? { target: "_blank", rel: "noopener" } : {})}>{children}</a>;
}

/**
 * Keeps heading levels in a logical order for screen readers:
 * a heading can only be one level deeper than the one before it.
 */
function remarkHeadingOrder() {
  return (tree: Root) => {
    let last = 1; // the page title is the h1
    const visit = (node: { type: string; children?: unknown[] }) => {
      if (node.type === "heading") {
        const h = node as Heading;
        if (h.depth === 1) h.depth = 2;
        if (h.depth > last + 1) h.depth = (last + 1) as Heading["depth"];
        last = h.depth;
      }
      (node.children as { type: string }[] | undefined)?.forEach((c) => visit(c as { type: string; children?: unknown[] }));
    };
    visit(tree);
  };
}

/** The blocks a page file may use. To add your own block, write the component and list it here. */
export const mdxComponents = {
  img: Img,
  a: A,
  BankDetails,
  ContactForm,
  PrayerForm,
  EventsCalendar,
  ServiceInfo,
  MapEmbed,
  EditMe,
  YouTube,
  Scripture,
  TeamGrid,
  ContactDetails,
};

export async function Mdx({ source }: { source: string }) {
  const { default: Content } = await evaluate(source, { ...runtime, remarkPlugins: [remarkGfm, remarkHeadingOrder], baseUrl: import.meta.url });
  return <Content components={mdxComponents} />;
}
