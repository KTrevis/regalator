import { useMutation, useQuery } from "@tanstack/react-query";
import { useEden } from "../lib/eden";

export const useGetBranches = () => {
  const eden = useEden();
  return useQuery(eden.api.git.branches.get.queryOptions());
};

export const useSwitchBranch = () => {
  const eden = useEden();

  return useMutation(eden.api.git.branch.switch.post.mutationOptions());
};
