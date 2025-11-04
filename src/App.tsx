import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './themes';
import { AppRoutes } from './shared/components/routing/AppRoutes';
import { RouteGuard } from './shared/components/routing/RouteGuard';
import { useAuth } from './shared/stores';
import ErrorBoundary from './shared/components/ErrorBoundary';

function App() {
  const { initialize, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return (
    <ThemeProvider defaultTheme="tita-corporate">
      <Router>
        <ErrorBoundary>
          <RouteGuard>
            <AppRoutes />
          </RouteGuard>
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
}

export default App;
