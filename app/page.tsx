import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CurrentDrop from "@/components/CurrentDrop";
import Statement from "@/components/Statement";
import Editorial from "@/components/Editorial";
import CommunityStrip from "@/components/CommunityStrip";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

// Order matches brief §4: Hero → Drop → Statement → Editorial → Social → Footer.
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CurrentDrop />
        <Statement />
        <Editorial />
        <CommunityStrip />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
