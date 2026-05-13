import type { Metadata } from "next";
import type { JSX } from "react";

import {
  getTranslator,
  translationsLoaders,
} from "@/lib/i18n/landing/index.ts";
import type { Locale } from "@/lib/i18n/landing/index.ts";

import { CtaSection } from "./components/cta-section.tsx";
import { FeaturesSection } from "./components/features-section.tsx";
import { HeroSection } from "./components/hero-section.tsx";
import { LandingFooter } from "./components/landing-footer.tsx";
import { LandingHeader } from "./components/landing-header.tsx";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return Object.keys(translationsLoaders).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslator(locale);

  const languages = Object.keys(translationsLoaders).reduce<
    Record<string, string>
  >((acc, loc) => {
    acc[loc] = `/${loc}`;
    return acc;
  }, {});

  return {
    title: t("landing.meta.title"),
    description: t("landing.meta.description"),
    alternates: {
      languages: {
        ...languages,
        "x-default": "/en",
      },
    },
  };
}

export default async function LandingPage({
  params,
}: Props): Promise<JSX.Element> {
  const { locale } = await params;
  const { t } = await getTranslator(locale);

  const signinHref = `/${locale}/signin`;

  return (
    <>
      <LandingHeader
        siteName={t("common.siteName")}
        signInLabel={t("common.signIn")}
        skipToContentLabel={t("common.skipToContent")}
        signinHref={signinHref}
      />
      <main id="main-content">
        <HeroSection
          eyebrowLabel={t("landing.hero.eyebrow")}
          headline={t("landing.hero.headline")}
          subheadline={t("landing.hero.subheadline")}
          ctaLabel={t("landing.hero.cta")}
          signinHref={signinHref}
        />
        <FeaturesSection
          sectionLabel={t("landing.features.sectionLabel")}
          heading={t("landing.features.heading")}
          subheading={t("landing.features.subheading")}
          features={[
            {
              name: t("landing.features.realtime.name"),
              description: t("landing.features.realtime.description"),
            },
            {
              name: t("landing.features.workspaces.name"),
              description: t("landing.features.workspaces.description"),
            },
            {
              name: t("landing.features.files.name"),
              description: t("landing.features.files.description"),
            },
          ]}
        />
        <CtaSection
          headline={t("landing.cta.headline")}
          subheadline={t("landing.cta.subheadline")}
          ctaLabel={t("landing.cta.button")}
          signinHref={signinHref}
        />
      </main>
      <LandingFooter
        copyright={t("landing.footer.copyright", {
          year: String(new Date().getFullYear()),
        })}
        currentLocale={locale}
        localeSwitcherLabel={t("common.language")}
        supportedLocales={Object.keys(translationsLoaders) as Locale[]}
      />
    </>
  );
}
