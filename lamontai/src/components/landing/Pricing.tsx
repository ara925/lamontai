'use client'

import React from 'react'
import Container from '../ui/Container'
import Button from '../ui/Button'

interface PlanFeature {
  available: boolean
  label: string
}

interface PricingPlan {
  name: string
  price: number
  description: string
  features: PlanFeature[]
  buttonText: string
  buttonLink: string
  isPopular?: boolean
}

export default function Pricing() {
  const plans: PricingPlan[] = [
    {
      name: 'Starter',
      price: 29,
      description: 'Perfect for individuals and small websites just getting started with SEO.',
      features: [
        { available: true, label: '5 articles per month' },
        { available: true, label: 'Basic keyword research' },
        { available: true, label: 'Up to 1,500 words per article' },
        { available: true, label: 'Export to WordPress' },
        { available: false, label: 'Priority support' },
        { available: false, label: 'Advanced SEO optimization' },
        { available: false, label: 'Automated publishing' },
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '/register?plan=starter',
    },
    {
      name: 'Professional',
      price: 79,
      description: 'For growing businesses looking to scale their content strategy.',
      features: [
        { available: true, label: '20 articles per month' },
        { available: true, label: 'Advanced keyword research' },
        { available: true, label: 'Up to 2,500 words per article' },
        { available: true, label: 'Export to any platform' },
        { available: true, label: 'Priority support' },
        { available: true, label: 'Advanced SEO optimization' },
        { available: false, label: 'Automated publishing' },
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '/register?plan=professional',
      isPopular: true,
    },
    {
      name: 'Enterprise',
      price: 199,
      description: 'Full-service solution for agencies and large websites.',
      features: [
        { available: true, label: 'Unlimited articles' },
        { available: true, label: 'Premium keyword research' },
        { available: true, label: 'Unlimited word count' },
        { available: true, label: 'Export to any platform' },
        { available: true, label: '24/7 dedicated support' },
        { available: true, label: 'Advanced SEO optimization' },
        { available: true, label: 'Automated publishing' },
      ],
      buttonText: 'Contact Sales',
      buttonLink: '/contact',
    },
  ]

  return (
    <section id="pricing" className="py-20 bg-white">
      <Container>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for your content needs. All plans include a 7-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`
                bg-white rounded-xl border overflow-hidden flex flex-col
                ${plan.isPopular 
                  ? 'shadow-xl border-primary/20 relative' 
                  : 'shadow-md border-gray-200'
                }
              `}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-sm font-semibold py-1 px-4 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <div className="p-10 flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-5 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-gray-600 mb-8">{plan.description}</p>
                
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full ${feature.available ? 'text-primary' : 'text-gray-400'} mr-3`}>
                        {feature.available ? (
                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                          </svg>
                        )}
                      </span>
                      <span className={feature.available ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="px-10 pb-10">
                <Button
                  href={plan.buttonLink}
                  variant={plan.isPopular ? 'primary' : 'outline'}
                  className={`w-full justify-center py-3 text-base ${plan.isPopular ? 'shadow-lg' : ''}`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-24 text-center text-gray-600">
          <p>Need a custom plan? <a href="/contact" className="text-primary font-medium hover:underline">Contact us</a> for custom enterprise pricing.</p>
        </div>
      </Container>
    </section>
  )
} 