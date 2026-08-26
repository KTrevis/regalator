import { useQuery } from "@tanstack/react-query";
import { useEden } from "../lib/eden";

export const useGetAgentRuns = () => {
  const eden = useEden();

  return useQuery({
    ...eden.api["agent-runs"].get.queryOptions(),
    refetchInterval: 2_000,
  });
};
