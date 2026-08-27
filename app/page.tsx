import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CurrentDrop from "@/components/CurrentDrop";
import Statement from "@/components/Statement";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

// Order matches brief §4: Hero → Drop → Statement → Newsletter → Footer
// (Editorial and Community/Instagram sections intentionally removed per client).
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CurrentDrop />
        <Statement />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
