// src/pages/_app.tsx
import '../styles/globals.css';
import '@fontsource/roboto';
import '@fontsource/amiri';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import type { AppProps } from 'next/app';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatbotWidget from '../components/ChatbotWidget';
import { useRouter } from 'next/router';
import { GoogleOAuthProvider } from '@react-oauth/google';

function AppContent({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const isAdminRoute = false; // Desactivar la lógica de rutas admin para que siempre muestre el header normal

    return (
        <>
            {!isAdminRoute && <Header />}
            <Component {...pageProps} />
            {!isAdminRoute && <Footer />}
            <Toaster position="top-right" />
            <ChatbotWidget />
        </>
    );
}

export default function App(props: AppProps) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
            <AuthProvider>
                <AppContent {...props} />
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
