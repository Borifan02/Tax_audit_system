/**
 * useAuditorData Hook
 * Manages all data fetching for the auditor workspace including
 * dashboard metrics, case lists, and workflow state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { auditorAPI } from '../services/api.js';

export function useAuditorData(userId) {
  const [dashboard, setDashboard] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const response = await auditorAPI.getDashboard(userId);
      const data = response?.data || response;
      setDashboard(data);
      return data;
    } catch (err) {
      console.warn('[useAuditorData] Dashboard fetch failed:', err.message);
      setError(err.message);
      return null;
    }
  }, [userId]);

  // Fetch cases list
  const fetchCases = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const response = await auditorAPI.getMyCases(userId);
      let casesData = response?.data || response?.content || response || [];
      casesData = Array.isArray(casesData) ? casesData : [];
      // Mock cases removed. Only rely on backend data.

      setCases(casesData);
      return casesData;
    } catch (err) {
      console.warn('[useAuditorData] Cases fetch failed:', err.message);
      setError(err.message);
      setCases([]);
      return [];
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchCases()]);
      setLoading(false);
    };
    
    loadAll();
  }, [userId, fetchDashboard, fetchCases]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchCases()]);
    setRefreshing(false);
  }, [fetchDashboard, fetchCases]);

  // Computed values
  const metrics = useMemo(() => {
    if (!dashboard) {
      return {
        totalAssigned: cases.length,
        inProgress: cases.filter(c => c.status === 'IN_PROGRESS').length,
        completed: cases.filter(c => c.status === 'COMPLETED' || c.status === 'CONCLUDED').length,
        pendingDocuments: 0,
        overdueFindings: 0,
        totalAuditDays: 0,
      };
    }
    return {
      totalAssigned: dashboard.totalAssigned || cases.length,
      inProgress: dashboard.inProgress || cases.filter(c => c.status === 'IN_PROGRESS').length,
      completed: dashboard.completed || cases.filter(c => c.status === 'COMPLETED' || c.status === 'CONCLUDED').length,
      pendingDocuments: dashboard.pendingDocuments || 0,
      overdueFindings: dashboard.overdueFindings || 0,
      totalAuditDays: dashboard.totalAuditDays || 0,
    };
  }, [dashboard, cases]);

  const activeCases = useMemo(() => {
    if (dashboard?.activeCases?.length > 0) {
      return dashboard.activeCases;
    }
    return cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'AUDITOR_ASSIGNED');
  }, [dashboard, cases]);

  const completedCases = useMemo(() => {
    if (dashboard?.recentCompleted?.length > 0) {
      return dashboard.recentCompleted;
    }
    return cases.filter(c => c.status === 'COMPLETED' || c.status === 'CONCLUDED');
  }, [dashboard, cases]);

  return {
    // Data
    dashboard,
    cases,
    metrics,
    activeCases,
    completedCases,
    
    // State
    loading,
    refreshing,
    error,
    
    // Actions
    refresh,
    fetchDashboard,
    fetchCases,
  };
}

export default useAuditorData;
