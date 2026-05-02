'use client';

import { useTranslations } from 'next-intl';
import { Shield, Lock, CreditCard, Eye } from 'lucide-react';

export default function Trust() {
  const t = useTranslations('Trust');

  const benefits = [
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: t('safeTitle'),
      desc: t('safeDesc')
    },
    {
      icon: <Eye className="w-6 h-6 text-blue-600" />,
      title: t('transparentTitle'),
      desc: t('transparentDesc')
    },
    {
      icon: <CreditCard className="w-6 h-6 text-blue-600" />,
      title: t('paymentTitle'),
      desc: t('paymentDesc')
    },
    {
      icon: <Lock className="w-6 h-6 text-blue-600" />,
      title: t('gdprTitle'),
      desc: t('gdprDesc')
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t('title')}</h2>
          <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{benefit.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-700">
              Joined by <span className="font-bold text-blue-600">5,000+</span> professionals this month
            </p>
          </div>
          <div className="flex items-center space-x-8 grayscale opacity-50">
            {/* Mock partner logos */}
            <div className="font-black text-xl italic">STRIPE</div>
            <div className="font-black text-xl italic">VISA</div>
            <div className="font-black text-xl italic">TRUST-E</div>
          </div>
        </div>
      </div>
    </section>
  );
}
