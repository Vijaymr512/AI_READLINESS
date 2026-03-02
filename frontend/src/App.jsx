import { Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AmbientMesh from './components/AmbientMesh';
import Navbar from './components/Navbar';

const SplashPage = lazy(() => import('./pages/SplashPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function Loader() {
    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-void)' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--j-core)', borderRightColor: 'var(--j-core)', animation: 'arcSpin 0.85s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: 'var(--j-gold)', animation: 'arcSpin 1.4s linear infinite reverse' }} />
                <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.6), transparent)', animation: 'arcCore 2s ease-in-out infinite' }} />
            </div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function PublicRoute({ children }) {
    const { token } = useAuth();
    if (token) return <Navigate to="/dashboard" replace />;
    return children;
}

const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    enter: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.40, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
        opacity: 0, y: -14, scale: 0.97,
        transition: { duration: 0.24, ease: [0.4, 0, 1, 1] }
    },
};

function PageWrapper({ children }) {
    return (
        <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit" style={{ width: '100%' }}>
            {children}
        </motion.div>
    );
}

function PrivateLayout({ children }) {
    return (
        <>
            <Navbar />
            <div className="page-wrap page-motion-wrap">{children}</div>
        </>
    );
}

function AppRoutes() {
    const location = useLocation();

    const splashSeen = sessionStorage.getItem('splash_seen');

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>

                { }
                <Route path="/splash" element={
                    <PublicRoute><SplashPage /></PublicRoute>
                } />

                { }
                <Route path="/login" element={<PublicRoute><PageWrapper><LoginPage /></PageWrapper></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><PageWrapper><SignupPage /></PageWrapper></PublicRoute>} />

                { }
                <Route path="/" element={
                    splashSeen
                        ? <Navigate to="/dashboard" replace />
                        : <Navigate to="/splash" replace />
                } />

                { }
                <Route path="/dashboard" element={<ProtectedRoute><PrivateLayout><PageWrapper><Dashboard /></PageWrapper></PrivateLayout></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><PrivateLayout><PageWrapper><UploadPage /></PageWrapper></PrivateLayout></ProtectedRoute>} />
                <Route path="/report/:id" element={<ProtectedRoute><PrivateLayout><PageWrapper><ReportPage /></PageWrapper></PrivateLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><PrivateLayout><PageWrapper><ProfilePage /></PageWrapper></PrivateLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><PrivateLayout><PageWrapper><SettingsPage /></PageWrapper></PrivateLayout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><PrivateLayout><PageWrapper><AdminPage /></PageWrapper></PrivateLayout></ProtectedRoute>} />

                { }
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

export default function App() {
    return (
        <>
            <AmbientMesh />
            <Suspense fallback={<Loader />}>
                <AppRoutes />
            </Suspense>
        </>
    );
}
