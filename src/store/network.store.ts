import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

export const useNetworkStore = create<NetworkState>(() => ({
  isConnected: true,
  isInternetReachable: null,
}));

NetInfo.addEventListener((state) => {
  useNetworkStore.setState({
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
  });
});
