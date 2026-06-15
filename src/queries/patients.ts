import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const patientListSelect = `
  id, first_name, last_name, dob, gender, phone, email, status, created_at,
  last_monthly_visit, last_annual_physical, last_semi_annual_report
`;

export const usePatientList = () =>
  useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data: viewData, error: viewError } = await supabase
        .from('patient_list_view')
        .select('*')
        .order('last_name', { ascending: true });

      if (!viewError && viewData) {
        return viewData.map((p: any) => ({
          ...p,
          last_visit: p.last_verified_visit || p.last_monthly_visit || undefined,
        }));
      }

      const { data, error } = await supabase
        .from('patients')
        .select(patientListSelect)
        .order('last_name', { ascending: true });

      if (error) throw error;
      const basePatients = data || [];
      const patientIds = basePatients.map((p: any) => p.id);

      if (patientIds.length === 0) return [];

      const { data: visitsData } = await supabase
        .from('visits')
        .select('patient_id, scheduled_at')
        .in('patient_id', patientIds)
        .eq('status', 'Verified')
        .order('scheduled_at', { ascending: false })
        .limit(Math.max(patientIds.length * 3, 300));

      const lastVisitByPatient = new Map<string, string>();
      (visitsData || []).forEach((visit: any) => {
        if (!lastVisitByPatient.has(visit.patient_id)) {
          lastVisitByPatient.set(visit.patient_id, visit.scheduled_at);
        }
      });

      return basePatients.map((p: any) => ({
        ...p,
        last_visit: lastVisitByPatient.get(p.id) || p.last_monthly_visit || undefined,
      }));
    },
    staleTime: 60_000,
  });

export const useMedicalProviders = () =>
  useQuery({
    queryKey: ['medical-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60_000,
  });
