import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEden } from "../lib/eden";

export const useGetAgentRuns = () => {
  const eden = useEden();

  return useQuery({
    ...eden.api["agent-runs"].get.queryOptions(),
    refetchInterval: 2_000,
  });
};

export const useDeleteAgentRun = (agentRunId: string) => {
  const eden = useEden();
  const queryClient = useQueryClient();

  return useMutation(
    eden.api["agent-runs"]({ id: agentRunId }).delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    }),
  );
};
