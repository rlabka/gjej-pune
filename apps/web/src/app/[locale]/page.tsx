import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import TrustLogos from '@/components/TrustLogos';
import AppComingSoon from '@/components/AppComingSoon';
import HowItWorks from '@/components/HowItWorks';
import PlatformOffer from '@/components/PlatformOffer';
import CitySearch from '@/components/CitySearch';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import CTASection from '@/components/CTASection';
import WhyUs from '@/components/WhyUs';
import ServicesOverview from '@/components/ServicesOverview';
import Footer from '@/components/Footer';
import HomePageClient from '@/components/HomePageClient';

export default function HomePage() {
  return (
    <HomePageClient>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <TrustLogos />
          <AppComingSoon />
          <HowItWorks />
          <PlatformOffer />
          <CitySearch />
          <Testimonials />
          <FAQ />
          <CTASection />
          <WhyUs />
          <ServicesOverview />
        </main>
        <Footer />
      </div>
    </HomePageClient>
  );
}
