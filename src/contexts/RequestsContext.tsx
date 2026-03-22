import { createContext, useContext } from 'react';
import type { Request, RequestStatus } from '@/types/database';
import type { CreateRequestData } from '@/hooks/useRequests';
import { useRequests } from '@/hooks/useRequests';

interface RequestsContextType {
  requests: Request[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  pendingQueueCount: number;
  refetch: () => Promise<void>;
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  createRequest: (data: CreateRequestData) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
}

const RequestsContext = createContext<RequestsContextType | null>(null);

export function RequestsProvider({ children }: { children: React.ReactNode }) {
  const value = useRequests();
  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useRequestsContext(): RequestsContextType {
  const context = useContext(RequestsContext);
  if (!context) {
    throw new Error('useRequestsContext must be used within RequestsProvider');
  }
  return context;
}
