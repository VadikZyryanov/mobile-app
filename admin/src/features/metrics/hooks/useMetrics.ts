import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import {
  getRegistrationsDaily,
  getSubscriptionEventsDaily,
  getTierDistribution,
  getActiveSubs,
  getContentStats,
} from '../api/getMetrics';

export const useRegistrationsDaily = (days: number) =>
  useQuery({
    queryKey: qk.metrics.registrations(days),
    queryFn: () => getRegistrationsDaily(days),
  });

export const useSubscriptionEventsDaily = (days: number) =>
  useQuery({
    queryKey: qk.metrics.subscriptionEvents(days),
    queryFn: () => getSubscriptionEventsDaily(days),
  });

export const useTierDistribution = () =>
  useQuery({ queryKey: qk.metrics.tierDistribution, queryFn: getTierDistribution });

export const useActiveSubs = () =>
  useQuery({ queryKey: qk.metrics.activeSubs, queryFn: getActiveSubs });

export const useContentStats = () =>
  useQuery({ queryKey: qk.metrics.contentStats, queryFn: getContentStats });
