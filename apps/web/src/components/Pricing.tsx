'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';

export default function Pricing() {
  const t = useTranslations('Pricing');

  const plans = [
    {
      name: t('basic'),
      price: '0',
      features: [
        t('featureFreeReg'),
        t('featureCreateProfile'),
        t('featureUnlimitedMsgs'),
        t('featureNotifications')
      ],
      cta: t('getStarted'),
      featured: false
    },
    {
      name: t('premium'),
      price: '29',
      features: [
        t('featureEverythingBasic'),
        t('featureReadAllMsgs'),
        t('featurePrioritySupport'),
        t('featureProfileBadge')
      ],
      cta: t('choosePremium'),
      featured: true
    },
    {
      name: t('pro'),
      price: '49',
      features: [
        t('featureEverythingPremium'),
        t('featureFeaturedProfile'),
        t('featureAdvancedAnalytics'),
        t('featureDedicatedManager')
      ],
      cta: t('goPro'),
      featured: false
    }
  ];

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t('title')}</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t('payOnlyToRead')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-[2rem] bg-white border-2 ${plan.featured ? 'border-blue-600 shadow-xl scale-105 z-10' : 'border-slate-100 shadow-sm'} transition-all hover:shadow-xl`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                  <Star size={14} fill="currentColor" />
                  <span>{t('mostPopular')}</span>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">CHF {plan.price}</span>
                  <span className="text-slate-500 ml-1">{t('perMonth')}</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3 text-sm text-slate-600">
                    <Check className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.featured ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            {t('freeSignup')} • Cancel anytime • 100% Secure
          </p>
        </div>
      </div>
    </section>
  );
}
