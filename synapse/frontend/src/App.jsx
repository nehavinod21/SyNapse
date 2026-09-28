import { lazy, Suspense } from "react";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "./context/AuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import LoadingSpinner from "./components/LoadingSpinner.jsx";

import AppShell from "./layouts/AppShell.jsx";



const Login = lazy(() => import("./pages/Login.jsx"));

const Signup = lazy(() => import("./pages/Signup.jsx"));

const Unauthorized = lazy(() => import("./pages/Unauthorized.jsx"));

const Landing = lazy(() => import("./pages/Landing.jsx"));

const Onboarding = lazy(() => import("./pages/Onboarding.jsx"));

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));



const SplashScreen = lazy(() => import("./pages/student/SplashScreen.jsx"));

const TopicSelection = lazy(() => import("./pages/student/TopicSelection.jsx"));

const AACSession = lazy(() => import("./pages/student/AACSession.jsx"));

const CelebrationScreen = lazy(() => import("./pages/student/CelebrationScreen.jsx"));



const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard.jsx"));

const TeacherChildren = lazy(() => import("./pages/teacher/TeacherChildren.jsx"));

const TeacherSessionsHub = lazy(() => import("./pages/teacher/TeacherSessionsHub.jsx"));

const TeacherReportsHub = lazy(() => import("./pages/teacher/TeacherReportsHub.jsx"));

const TeacherStudentProfile = lazy(() => import("./pages/teacher/TeacherStudentProfile.jsx"));

const TeacherLiveSession = lazy(() => import("./pages/teacher/TeacherLiveSession.jsx"));

const ActiveSession = lazy(() => import("./pages/teacher/ActiveSession.jsx"));

const ChildHistory = lazy(() => import("./pages/teacher/ChildHistory.jsx"));



const SODashboard = lazy(() => import("./pages/send_officer/SODashboard.jsx"));

const SOChildren = lazy(() => import("./pages/send_officer/SOChildren.jsx"));

const SOReportsHub = lazy(() => import("./pages/send_officer/SOReportsHub.jsx"));

const SOAssessmentsRedirect = lazy(() => import("./pages/send_officer/SOAssessmentsRedirect.jsx"));

const AssessmentConsole = lazy(() => import("./pages/send_officer/AssessmentConsole.jsx"));

const ReportViewer = lazy(() => import("./pages/send_officer/ReportViewer.jsx"));

const KhdaReportViewer = lazy(() => import("./pages/send_officer/KhdaReportViewer.jsx"));



const CaregiverDashboard = lazy(() => import("./pages/caregiver/CaregiverDashboard.jsx"));

const HomeSession = lazy(() => import("./pages/caregiver/HomeSession.jsx"));

const ProgressView = lazy(() => import("./pages/caregiver/ProgressView.jsx"));

const PrivacyPanel = lazy(() => import("./pages/caregiver/PrivacyPanel.jsx"));



const RoleSettingsPage = lazy(() => import("./pages/settings/RoleSettingsPage.jsx"));

const SupportChatWidget = lazy(() => import("./components/SupportChatWidget.jsx"));



import { useOnlineStatus } from "./hooks/useOnlineStatus.js";



function PageLoader() {

  return (

    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ee]">

      <LoadingSpinner />

    </div>

  );

}



function RoleHome() {

  const { user, loading } = useAuth();

  if (loading) {

    return <PageLoader />;

  }

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {

    case "student":

      return <Navigate to="/student/splash" replace />;

    case "teacher":

      return <Navigate to="/teacher/dashboard" replace />;

    case "send_officer":

      return <Navigate to="/send-officer/dashboard" replace />;

    case "caregiver":

      return <Navigate to="/caregiver/dashboard" replace />;

    default:

      return <Navigate to="/login" replace />;

  }

}



function AnimatedRoutes() {

  const location = useLocation();

  return (

    <AnimatePresence mode="wait">

      <motion.div

        key={location.pathname}

        initial={{ opacity: 0, y: 6 }}

        animate={{ opacity: 1, y: 0 }}

        exit={{ opacity: 0, y: -6 }}

        transition={{ duration: 0.18 }}

        className="app-page min-h-screen w-full"

      >

        <Suspense fallback={<PageLoader />}>

          <Routes location={location}>

            <Route path="/" element={<Landing />} />

            <Route path="/login" element={<Login />} />

            <Route path="/signup" element={<Signup />} />

            <Route path="/onboarding" element={<Onboarding />} />

            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/dashboard" element={<RoleHome />} />



            <Route element={<ProtectedRoute allowedRoles={["teacher", "caregiver"]} />}>

              <Route path="/dashboard-parent" element={<Dashboard />} />

            </Route>



            <Route element={<ProtectedRoute allowedRoles={["student", "teacher"]} />}>

              <Route path="/student/splash" element={<SplashScreen />} />

              <Route path="/student/topics" element={<TopicSelection />} />

              <Route path="/student/session" element={<AACSession />} />

              <Route path="/student/celebration" element={<CelebrationScreen />} />

            </Route>



            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>

              <Route element={<AppShell />}>

                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

                <Route path="/teacher/children" element={<TeacherChildren />} />

                <Route path="/teacher/sessions-hub" element={<TeacherSessionsHub />} />

                <Route path="/teacher/reports" element={<TeacherReportsHub />} />

                <Route path="/teacher/settings" element={<RoleSettingsPage />} />

                <Route path="/teacher/students/:childId" element={<TeacherStudentProfile />} />

                <Route path="/teacher/sessions/:sessionId/live" element={<TeacherLiveSession />} />

                <Route path="/teacher/session/:child_id" element={<ActiveSession />} />

                <Route path="/teacher/child/:child_id" element={<ChildHistory />} />

              </Route>

            </Route>



            <Route element={<ProtectedRoute allowedRoles={["send_officer"]} />}>

              <Route element={<AppShell />}>

                <Route path="/send-officer/dashboard" element={<SODashboard />} />

                <Route path="/send-officer/children" element={<SOChildren />} />

                <Route path="/send-officer/assessments" element={<SOAssessmentsRedirect />} />

                <Route path="/send-officer/reports-hub" element={<SOReportsHub />} />

                <Route path="/send-officer/settings" element={<RoleSettingsPage />} />

                <Route path="/send-officer/assessment/:id" element={<AssessmentConsole />} />

                <Route path="/send-officer/report/:id" element={<ReportViewer />} />

                <Route path="/send-officer/khda-report/:childId" element={<KhdaReportViewer />} />

              </Route>

            </Route>



            <Route element={<ProtectedRoute allowedRoles={["caregiver"]} />}>

              <Route element={<AppShell />}>

                <Route path="/caregiver/dashboard" element={<CaregiverDashboard />} />

                <Route path="/caregiver/progress" element={<ProgressView />} />

                <Route path="/caregiver/session" element={<HomeSession />} />

                <Route path="/caregiver/sessions/:sessionId/live" element={<TeacherLiveSession />} />

                <Route path="/caregiver/privacy" element={<PrivacyPanel />} />

                <Route path="/caregiver/settings" element={<RoleSettingsPage />} />

              </Route>

            </Route>



            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>

        </Suspense>

      </motion.div>

    </AnimatePresence>

  );

}



export default function App() {

  const online = useOnlineStatus();

  return (

    <div className="app-shell">

      {!online && (

        <div

          style={{

            background: "#f59e0b",

            color: "#1a1a1a",

            textAlign: "center",

            padding: "8px",

            fontSize: "14px",

            fontWeight: 600,

            zIndex: 9999,

            flexShrink: 0,

          }}

        >

          ⚠️ Offline mode — showing last synced AAC cards

        </div>

      )}

      <AnimatedRoutes />

      <Suspense fallback={null}>

        <SupportChatWidget />

      </Suspense>

    </div>

  );

}


