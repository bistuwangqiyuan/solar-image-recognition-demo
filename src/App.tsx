import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { UploadPage } from '@/pages/UploadPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { DemoPage } from '@/pages/DemoPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AIModelProvider } from '@/contexts/AIModelContext';

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AIModelProvider>
        <div className="min-h-screen bg-secondary-50 flex flex-col">
          <ErrorBoundary>
            <Header />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/results/:imageId" element={<ResultsPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            
            <Footer />
          </ErrorBoundary>
          
          {/* Toast通知 */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AIModelProvider>
    </QueryClientProvider>
  );
}

export default App;

