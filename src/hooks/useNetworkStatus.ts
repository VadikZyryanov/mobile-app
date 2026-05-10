import { useNetworkStore } from '@/store/network.store';

export const useNetworkStatus = () => {
  const isOnline = useNetworkStore((s) => s.isConnected && s.isInternetReachable !== false);
  return { isOnline };
};
