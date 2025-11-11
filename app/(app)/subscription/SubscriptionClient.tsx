"use client"

import React, { useState } from 'react'
import Link from 'next/link'

type Plan = {
  id: string
  title: string
  price: string
  period?: string
  features: string[]
  current?: boolean
}

const plans: Plan[] = [
  {
    id: 'free',
    title: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['Upload videos', 'View public videos', 'Basic compression'],
    current: true,
  },
  {
    id: 'pro',
    title: 'Pro',
    price: '₹199',
    period: 'per month',
    features: ['Higher upload limits', 'Faster processing', 'Priority support'],
  },
  {
    id: 'lifetime',
    title: 'Lifetime',
    price: '₹1699',
    period: 'one-time',
    features: ['All Pro features', 'Lifetime access', 'Discounted future upgrades'],
  },
]

export default function SubscriptionClient() {
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function selectPlan(id: string) {
    setSelected(id)
    setMessage(`You selected the ${id} plan. (No payment implemented)`)
    // Clear message after a short time
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-sm text-gray-300">Choose a plan that fits your needs.</p>
        </div>
        <div>
          <Link href="/" className="btn btn-ghost btn-sm">
            Back to Home
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-md bg-gray-950 text-white">{message}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card border ${plan.current ? 'border-primary' : 'border-stone-600'} ${plan.current ? 'bg-gray-950' : ''} shadow-lg hover:border-white  rounded-xl transition p-4`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{plan.title}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold">{plan.price}</div>
                <div className="text-sm text-gray-400">{plan.period}</div>
              </div>
            </div>
            <ul className="mt-4 mb-4 list-disc list-inside text-sm text-gray-300">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <div className="flex items-center justify-between">
              {plan.current ? (
                <div className="text-sm text-green-500 font-semibold">Current Plan</div>
              ) : (
                <button
                  className={`btn btn-primary border-2 rounded-xl bg-gray-950 btn-sm ${selected === plan.id ? 'btn-disabled' : ''}`}
                  onClick={() => selectPlan(plan.id)}
                >
                  {selected === plan.id ? 'Selected' : 'Choose'}
                </button>
              )}

              <button
                className="btn btn-ghost border-2 rounded-xl btn-sm"
                onClick={() => setMessage(`Previewing ${plan.title} features`)}
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
