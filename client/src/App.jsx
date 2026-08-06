import { Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Struggles from "./components/Struggles";
import Story from "./components/Story";
import Benefits from "./components/Benefits";
import ApplyForm from "./components/ApplyForm";
import Faq from "./components/Faq";
import FinalCta from "./components/FinalCta";
import Footer from "./components/Footer";
import ReadyPage from "./components/ReadyPage";
import GuidePopup from "./components/GuidePopup";
import FeedbackForm from "./components/FeedbackForm";
import BackToTop from "./components/BackToTop";
import Blog from "./components/Blog";
import BlogPost from "./components/BlogPost";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import Signup from "./components/members/Signup";
import Login from "./components/members/Login";
import ForgotPassword from "./components/members/ForgotPassword";
import ResetPassword from "./components/members/ResetPassword";
import MemberDashboard from "./components/members/Dashboard";
import WorkoutLogger from "./components/members/WorkoutLogger";
import RoutineEditor from "./components/members/RoutineEditor";
import PlansList from "./components/members/PlansList";
import PlanEditor from "./components/members/PlanEditor";
import ExerciseCatalog from "./components/members/ExerciseCatalog";
import Progress from "./components/members/Progress";
import DesignSystem from "./components/DesignSystem";

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
        <Route path="/feedback" element={<FeedbackForm />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/gym" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<MemberDashboard />} />
        <Route path="/app/new" element={<WorkoutLogger />} />
        <Route path="/app/routine" element={<RoutineEditor />} />
        <Route path="/app/plans" element={<PlansList />} />
        <Route path="/app/plans/new" element={<PlanEditor />} />
        <Route path="/app/plans/:id" element={<PlanEditor />} />
        <Route path="/app/exercises" element={<ExerciseCatalog />} />
        <Route path="/app/progress" element={<Progress />} />
        <Route path="/design" element={<DesignSystem />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LanguageProvider>
  );
}
