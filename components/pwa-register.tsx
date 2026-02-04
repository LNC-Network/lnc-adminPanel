"use client";

import { useEffect } from 'react';

export function PWARegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then((registration) => {
                        console.log('Service Worker registered:', registration);

                        // Check for updates periodically
                        setInterval(() => {
                            registration.update();
                        }, 60000); // Check every minute
                    })
                    .catch((error) => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }

        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            // Store the event globally so InstallPrompt can access it
            (window as any).deferredPrompt = e;

            // Check if user dismissed the prompt before
            const dismissed = localStorage.getItem('pwa-install-dismissed');

            // Only show on dashboard page (after login) and if not dismissed
            const isDashboard = window.location.pathname.includes('/dashboard');

            if (isDashboard && !dismissed) {
                // Delay showing banner by 3 seconds to avoid interrupting user
                setTimeout(() => {
                    const installBanner = document.getElementById('install-banner');
                    if (installBanner) {
                        installBanner.classList.remove('hidden-initially');
                    }
                }, 3000);
            }
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            (window as any).deferredPrompt = null;

            // Hide the install banner
            const installBanner = document.getElementById('install-banner');
            if (installBanner) {
                installBanner.classList.add('hidden-initially');
            }
        });



        //   Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            // Don't request immediately, wait for user interaction
        }

        // Handle online/offline status
        const updateOnlineStatus = () => {
            const status = navigator.onLine ? 'online' : 'offline';
            document.body.setAttribute('data-connection', status);

            if (!navigator.onLine) {
                // Show offline notification
                const offlineDiv = document.createElement('div');
                offlineDiv.id = 'offline-notification';
                offlineDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:linear-gradient(to right,#7dd3fc,#c4b5fd);color:white;padding:8px;text-align:center;z-index:9999;font-size:14px;font-weight:500;';
                offlineDiv.textContent = '⚠️ You are offline. Some features may be limited.';
                document.body.appendChild(offlineDiv);
            } else {
                const offlineDiv = document.getElementById('offline-notification');
                if (offlineDiv) {
                    offlineDiv.remove();
                }
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    return null;
}

export function InstallPrompt() {
    const handleInstall = async () => {
        const deferredPrompt = (window as any).deferredPrompt;
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        (window as any).deferredPrompt = null;
        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.add('hidden-initially');
    };

    const handleDismiss = () => {
        // Store dismissal in localStorage so it doesn't show again
        localStorage.setItem('pwa-install-dismissed', 'true');

        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.add('hidden-initially');
    };

    return (
        <div
            id="install-banner"
            className="hidden-initially fixed bottom-4 left-4 right-4 bg-gradient-to-r from-sky-500 to-violet-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md mx-auto"
        >
            <div className="flex-1">
                <p className="font-semibold text-sm">Install LNC Admin App</p>
                <p className="text-xs opacity-90">Add to home screen for quick access</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
                <button
                    onClick={handleInstall}
                    className="bg-white text-violet-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition"
                >
                    Install
                </button>
                <button
                    onClick={handleDismiss}
                    className="p-2 hover:bg-white/10 rounded-md transition"
                    aria-label="Dismiss notification"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}
