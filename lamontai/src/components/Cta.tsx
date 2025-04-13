'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import { motion } from 'framer-motion'

const Cta = () => {
  return (
    <section className="py-20 bg-blue-600">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Content Strategy?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of content creators who are already using our platform to create better content, faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                href="/signup"
                variant="secondary"
                size="large"
              >
                Start Free Trial
              </Button>
              <Button
                href="/demo"
                variant="outline"
                size="large"
                className="bg-transparent border-white text-white hover:bg-white/10"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Cta 