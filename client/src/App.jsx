import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Struggles from "./components/Struggles";
import Story from "./components/Story";
import HowItWorks from "./components/HowItWorks";
import Benefits from "./components/Benefits";
import Testimonials from "./components/Testimonials";
import ApplyForm from "./components/ApplyForm";
import Faq from "./components/Faq";
import FinalCta from "./components/FinalCta";
import Footer from "./components/Footer";
import ReadyPage from "./components/ReadyPage";
import GuidePopup from "./components/GuidePopup";

function Landing() {
  return (
    <div className="relative z-[1]">
      <GuidePopup />
      <Navbar />
      <main>
        <Hero />
        <Struggles />
        <Story />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <ApplyForm />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ready" element={<ReadyPage />} />
      </Routes>
    </LanguageProvider>
  );
}
