import React from 'react'
import SubscriptionClient from './SubscriptionClient'

export const metadata = {
  title: 'Subscription — CreoVue',
  description: 'Choose a subscription plan for CreoVue',
}

export default function SubscriptionPage() {
  return (
    <div>
      <SubscriptionClient />
    </div>
  )
}
