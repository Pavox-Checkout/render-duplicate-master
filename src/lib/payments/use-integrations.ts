import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listIntegrations,
  saveIntegration,
  setIntegrationStatus,
  testIntegration,
} from "./integrations.functions";
import type { Environment, PaymentMethod } from "./catalog";

const KEY = ["payment-integrations"] as const;

export function useIntegrations() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => listIntegrations(),
  });
}

export function useSaveIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      provider: string;
      environment: Environment;
      methods: PaymentMethod[];
      credentials: Record<string, string>;
    }) => saveIntegration({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetIntegrationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: "connected" | "disabled" }) =>
      setIntegrationStatus({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useTestIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => testIntegration({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}
