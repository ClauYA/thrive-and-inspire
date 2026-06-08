import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Struggles from "./components/Struggles";
import Story from "./components/Story";
import Benefits from "./components/Benefits";
import Testimonials from "./components/Testimonials";
import ApplyForm from "./components/ApplyForm";
import Faq from "./components/Faq";
import FinalCta from "./components/FinalCta";
import Footer from "./components/Footer";
import ReadyPage from "./components/ReadyPage";
import GuidePopup from "./components/GuidePopup";
import BackToTop from "./components/BackToTop";
import Blog from "./components/Blog";
import BlogPost from "./components/BlogPost";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";

function Landing() {
  return (
    <div className="relative z-[1]">
      <GuidePopup />
      <Navbar />
      <main>
        <Hero />
        <Struggles />
        <Benefits />
        <Story />
        <Testimonials />
        <ApplyForm />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ready" element={<ReadyPage />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </LanguageProvider>
  );
}
