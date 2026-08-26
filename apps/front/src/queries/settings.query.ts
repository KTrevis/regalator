import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEden } from "../lib/eden";

export function useGetSettings() {
  const eden = useEden();
  return useQuery(eden.api.settings.get.queryOptions());
}

export function useUpdateSettings() {
  const eden = useEden();
  const queryClient = useQueryClient();

  return useMutation(
    eden.api.settings.put.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    }),
  );
}
