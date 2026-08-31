import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { Database, Lock, Mail, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — AkuafoDwa',
  description:
    'How AkuafoDwa handles your data: what we collect, how we use it, what we never do, and how to reach us.',
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-[#1b5e20] sm:text-2xl">
        <Icon size={22} aria-hidden="true" className="shrink-0 text-[#c49000]" strokeWidth={2.25} />
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-[#42514a]">{children}</div>
    </section>
  )
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#fbc02d]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fffdf5] text-[#1f2937]">
      <div className="h-1.5 kente-stripes" aria-hidden="true" />

      <header className="border-b border-[#dde5de] bg-[#fffdf5]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="group flex items-center gap-2.5 outline-none" aria-label="AkuafoDwa home">
            <span className="relative h-9 w-9 overflow-hidden rounded-lg shadow-sm ring-1 ring-[#fbc02d]/40 transition-all group-hover:ring-[#fbc02d]">
              <Image src="/logo.png" alt="" fill sizes="36px" className="object-cover" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-[#124116]">
              Akuafo<span className="italic text-[#c49000]">Dwa</span>
            </span>
          </a>
          <a
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#1b5e20] px-4 py-2 text-sm font-semibold text-[#fffdf5] shadow-sm transition-colors hover:bg-[#124116] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b5e20]"
          >
            Open the market
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[#124116] sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-2.5 text-sm text-[#52605a]">Last updated: 31 August 2026</p>

        <div className="mt-8 space-y-10 border-t border-[#dde5de] pt-8 sm:space-y-12">
          <Section icon={ShieldCheck} title="About this policy">
            <p>
              AkuafoDwa is Ghana&apos;s online farmers market — a place where farmers and traders list
              produce and livestock, and buyers make offers and negotiate deals directly. This page
              explains, in plain language, what information we collect and how we use it. The short
              version: we collect only what the market needs to work, we never sell your data, and
              there are no ads or trackers on AkuafoDwa.
            </p>
          </Section>

          <Section icon={Database} title="What we collect">
            <List
              items={[
                <>
                  <strong className="font-semibold text-[#1f2937]">Account details you give us.</strong>{' '}
                  Your name, email address, and optionally a phone number, a seller type or business
                  name, and a profile photo. Your password is stored only as an irreversible scrypt
                  hash — we can never read it.
                </>,
                <>
                  <strong className="font-semibold text-[#1f2937]">Listings &amp; activity.</strong> The
                  content you create on the market: listing titles, descriptions and photos, the offers
                  and chat messages you send, the reviews you leave, and the listings you save as
                  favorites.
                </>,
                <>
                  <strong className="font-semibold text-[#1f2937]">Identity verification.</strong> Only
                  if you choose to submit it: a photo of your Ghana Card, passport, driver&apos;s
                  licence or business registration. These documents are stored privately, viewable only
                  by AkuafoDwa admins, and used only to confirm who you are — never shown on the market.
                </>,
                <>
                  <strong className="font-semibold text-[#1f2937]">Push notifications.</strong> If you
                  enable them: your browser&apos;s push subscription endpoint, its encryption keys, and
                  your browser user agent. You can turn this off anytime.
                </>,
                <>
                  <strong className="font-semibold text-[#1f2937]">Server logs.</strong> Standard logs
                  kept by our hosting provider (Vercel) to run and secure the service.
                </>,
              ]}
            />
          </Section>

          <Section icon={ShieldCheck} title="How we use it">
            <p>We use your information to:</p>
            <List
              items={[
                <>run the marketplace and keep your account working,</>,
                <>connect buyers and sellers and move offers to agreed deals,</>,
                <>verify identities so people can trade with confidence,</>,
                <>deliver the offer and deal notifications you opted into,</>,
                <>keep the market safe and fair for everyone.</>,
              ]}
            />
          </Section>

          <Section icon={ShieldCheck} title="What we never do">
            <p>
              We never sell your personal data. We never run ads or third-party trackers on
              AkuafoDwa. Your business on the market stays between you and the people you deal with.
            </p>
          </Section>

          <Section icon={ShieldCheck} title="Sharing">
            <p>
              We don&apos;t share your data with anyone, apart from the infrastructure needed to run
              the site: hosting on Vercel and the database on Neon. And, of course, anything you
              choose to share yourself — for example when you share a listing to WhatsApp or another
              app, that share is yours.
            </p>
          </Section>

          <Section icon={Lock} title="Storage &amp; security">
            <p>
              Your data lives in a managed Postgres database. All traffic is encrypted in transit
              (HTTPS), passwords are stored as scrypt hashes, and identity documents are private to
              the admin team. We collect so little that there is simply less to protect.
            </p>
          </Section>

          <Section icon={Lock} title="Your choices">
            <p>
              You can edit or delete your listings anytime from your account. If you want your whole
              account deleted — profile, listings, chats and all — email us and we will take care of
              it.
            </p>
          </Section>

          <Section icon={ShieldCheck} title="Children">
            <p>
              AkuafoDwa is not directed at children under 13, and we do not knowingly collect their
              information.
            </p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>
              Questions, or a deletion request? Email us at{' '}
              <a
                href="mailto:support@akuafodwa.com"
                className="font-medium text-[#1b5e20] underline decoration-[#fbc02d] decoration-2 underline-offset-2 transition-colors hover:text-[#124116]"
              >
                support@akuafodwa.com
              </a>{' '}
              and a real person will reply.
            </p>
          </Section>
        </div>
      </main>

      <footer className="mt-auto border-t border-[#dde5de] bg-[#fffdf5]">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          <p className="text-center text-sm text-[#52605a]">
            © AkuafoDwa — Ghana&apos;s farmers market online
          </p>
        </div>
      </footer>
    </div>
  )
}
