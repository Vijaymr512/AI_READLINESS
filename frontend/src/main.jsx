import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EngineProvider } from './context/EngineContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <EngineProvider>
                    <App />
                </EngineProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
