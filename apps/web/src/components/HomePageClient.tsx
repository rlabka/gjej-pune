'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-2xl animate-pulse ${className || ''}`} />;
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-slate-100 flex items-center px-6">
        <SkeletonBlock className="w-36 h-8 rounded-lg" />
        <div className="flex-1" />
        <div className="hidden md:flex items-center space-x-6">
          <SkeletonBlock className="w-16 h-4 rounded-md" />
          <SkeletonBlock className="w-20 h-4 rounded-md" />
          <SkeletonBlock className="w-16 h-4 rounded-md" />
          <SkeletonBlock className="w-24 h-9 rounded-xl" />
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-[#162C66] to-[#0f1f4a] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <div className="h-10 bg-white/10 rounded-xl w-4/5 animate-pulse" />
                <div className="h-10 bg-white/10 rounded-xl w-3/5 animate-pulse" />
              </div>
              <div className="h-5 bg-white/10 rounded-lg w-full animate-pulse" />
              <div className="h-5 bg-white/10 rounded-lg w-2/3 animate-pulse" />
              <div className="flex gap-3 pt-2">
                <div className="h-12 bg-white/10 rounded-xl w-40 animate-pulse" />
                <div className="h-12 bg-white/10 rounded-xl w-40 animate-pulse" />
              </div>
              <div className="h-14 bg-white/5 rounded-2xl w-full animate-pulse mt-4" />
            </div>
            <div className="hidden lg:block w-80 h-80 bg-white/10 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Trust Logos Skeleton */}
      <div className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8">
          {[...Array(5)].map((_, i) => (
            <SkeletonBlock key={i} className="w-24 h-8 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Section Skeletons */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-4">
            <SkeletonBlock className="h-9 w-72 mx-auto rounded-xl" />
            <SkeletonBlock className="h-4 w-96 mx-auto rounded-lg max-w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4 p-6 bg-slate-50 rounded-2xl">
                <SkeletonBlock className="w-14 h-14 rounded-xl" />
                <SkeletonBlock className="h-5 w-3/4 rounded-lg" />
                <SkeletonBlock className="h-4 w-full rounded-lg" />
                <SkeletonBlock className="h-4 w-2/3 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Another Section */}
      <div className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-10">
            <SkeletonBlock className="h-9 w-64 mx-auto rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <SkeletonBlock className="w-14 h-14 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBlock className="h-4 w-24 rounded-md" />
                    <SkeletonBlock className="h-3 w-16 rounded-md" />
                  </div>
                </div>
                <SkeletonBlock className="h-4 w-full rounded-lg" />
                <SkeletonBlock className="h-4 w-5/6 rounded-lg" />
                <SkeletonBlock className="h-4 w-2/3 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePageClient({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!mounted ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <HomeSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
