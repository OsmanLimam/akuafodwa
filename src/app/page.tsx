'use client'

import React from 'react'
import { AppProvider, useApp } from '@/components/akuafo/store'
import { Header } from '@/components/akuafo/header'
import { Footer } from '@/components/akuafo/footer'
import { BrowseView } from '@/components/akuafo/browse-view'
import { ListingDetailView } from '@/components/akuafo/listing-detail-view'
import { CreateListingView } from '@/components/akuafo/create-listing-view'
import { MyListingsView } from '@/components/akuafo/my-listings-view'
import { InboxView } from '@/components/akuafo/inbox-view'
import { FavoritesView } from '@/components/akuafo/favorites-view'
import { ProfileView } from '@/components/akuafo/profile-view'
import { AdminView } from '@/components/akuafo/admin-view'
import { AuthDialog } from '@/components/akuafo/auth-dialog'
import { PwaRegistrar } from '@/components/akuafo/pwa'
import { WhatsAppFab } from '@/components/akuafo/social-buttons'
import { BottomNav } from '@/components/akuafo/bottom-nav'

function ViewRouter() {
  const { route } = useApp()

  switch (route.name) {
    case 'listing':
      return <ListingDetailView key={route.id} id={route.id!} />
    case 'sell':
      return <CreateListingView />
    case 'my-listings':
      return <MyListingsView />
    case 'inbox':
      return <InboxView routeId={route.id} routeQuery={route.query} />
    case 'favorites':
      return <FavoritesView />
    case 'profile':
      return <ProfileView />
    case 'admin':
      return <AdminView />
    default:
      return <BrowseView />
  }
}

function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 w-full pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <ViewRouter />
      </main>
      <Footer />
      <WhatsAppFab />
      <BottomNav />
      <AuthDialog />
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <Shell />
      <PwaRegistrar />
    </AppProvider>
  )
}
