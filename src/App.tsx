import { ThemeProvider } from './components/theme/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { RequestsProvider } from './contexts/RequestsContext';
import { AuthGate } from './components/auth/AuthGate';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rescue-one-theme">
      <AuthProvider>
        <RequestsProvider>
          <AuthGate />
        </RequestsProvider>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
