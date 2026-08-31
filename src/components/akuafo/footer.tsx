'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, ShieldCheck, Handshake } from 'lucide-react'
import { useApp } from './store'

export function Footer() {
  const { navigate, t } = useApp()
  return (
    <footer className="mt-auto bg-[#124116] text-[#FFFDF5]/80">
      <div className="h-1.5 kente-stripes" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative h-9 w-9 rounded-lg overflow-hidden ring-1 ring-[#FBC02D]/30">
                <Image src="/logo.png" alt="AkuafoDwa logo" fill sizes="36px" className="object-cover" />
              </span>
              <span className="font-display text-xl font-bold text-[#FFFDF5]">
                Akuafo<span className="italic text-[#FBC02D]">Dwa</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#FFFDF5]/60 max-w-xs">
              &ldquo;Akuafo&rdquo; means farmers, &ldquo;Dwa&rdquo; means market. Ghana&apos;s online market where
              farmers, traders and buyers meet to negotiate and deal directly.
            </p>
          </div>

          <nav aria-label="Footer">
            <h3 className="font-display font-semibold text-[#FFFDF5] mb-3">Market</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/')} className="hover:text-[#FBC02D] transition-colors">{t('browse')}</button></li>
              <li><button onClick={() => navigate('/sell')} className="hover:text-[#FBC02D] transition-colors">{t('sell_produce')}</button></li>
              <li><button onClick={() => navigate('/favorites')} className="hover:text-[#FBC02D] transition-colors">{t('saved')}</button></li>
              <li><button onClick={() => navigate('/inbox')} className="hover:text-[#FBC02D] transition-colors">{t('offers')}</button></li>
            </ul>
          </nav>

          <div>
            <h3 className="font-display font-semibold text-[#FFFDF5] mb-3">How AkuafoDwa works</h3>
            <ul className="space-y-2.5 text-sm text-[#FFFDF5]/60">
              <li className="flex gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#FBC02D]" />
                <span>Listings from all 16 regions of Ghana. Free to post.</span>
              </li>
              <li className="flex gap-2">
                <Handshake size={16} className="mt-0.5 shrink-0 text-[#FBC02D]" />
                <span>Buyers make offers, both sides negotiate to a fair deal.</span>
              </li>
              <li className="flex gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#FBC02D]" />
                <span>Contacts are shared only when a deal is agreed. Stay safe on-site.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#FFFDF5]/45">
          <p>© {new Date().getFullYear()} AkuafoDwa. Proudly made for Ghana&apos;s farmers.</p>
          <p className="font-display italic">“The market belongs to those who wake early.”</p>
        </div>
      </div>
    </footer>
  )
}
