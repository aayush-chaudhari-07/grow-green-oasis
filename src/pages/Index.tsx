import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyPlantsSection from "@/components/WhyPlantsSection";
import DiscountBanner from "@/components/DiscountBanner";
import ShopSection from "@/components/ShopSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <WhyPlantsSection />
      <DiscountBanner />
      <ShopSection />
      <Footer />
    </div>
  );
};

export default Index;
