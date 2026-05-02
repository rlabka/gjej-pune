'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Shield, FileText, MessageSquare, Clock, Star } from 'lucide-react';

export default function TrustAndSafety() {
  const t = useTranslations('TrustAndSafety');

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-[#162C66]" />,
      text: t('feature1')
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-[#162C66]" />,
      text: t('feature2')
    },
    {
      icon: <Clock className="w-6 h-6 text-[#162C66]" />,
      text: t('feature3')
    },
    {
      icon: <Star className="w-6 h-6 text-[#162C66]" />,
      text: t('feature4')
    }
  ];

  return (
    <section className="py-24 lg:py-40 bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-black text-[#162C66] mb-6 leading-tight">
            {t('title')}
          </h2>
          <p className="text-lg lg:text-xl text-[#666666] font-medium max-w-3xl mx-auto leading-relaxed mb-6">
            {t('description')}
          </p>
          <a 
            href="#security" 
            className="inline-flex items-center space-x-2 text-[#162C66] font-bold hover:text-[#F5C400] transition-colors group"
          >
            <span>{t('securityLink')}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left: Features List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-start space-x-5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#162C66] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-[#F5C400] group-hover:border-[#F5C400] transition-all duration-300">
                  {feature.icon}
                </div>
                <p className="text-lg lg:text-xl text-[#162C66] font-semibold leading-relaxed pt-2">
                  {feature.text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Illustration/Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80" 
                alt="Trust and Safety"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#162C66]/10 to-transparent" />
            </div>
            
            {/* Decorative Element */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#F5C400] rounded-full opacity-20 blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
