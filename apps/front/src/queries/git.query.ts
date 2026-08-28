import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useEden } from "../lib/eden";

const SWITCH_BRANCH_MUTATION_KEY = ["git", "switch-branch"];

export const useGetBranches = () => {
  const eden = useEden();
  return useQuery(eden.api.git.branches.get.queryOptions());
};

export const useSwitchBranch = () => {
  const eden = useEden();
  const queryClient = useQueryClient();

  return useMutation({
    ...eden.api.git.branch.switch.post.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
      onError: (error) => {
        toast.error("Failed to switch branch", {
          description: error.message,
        });
      },
    }),
    mutationKey: SWITCH_BRANCH_MUTATION_KEY,
  });
};

export const useIsSwitchingBranch = () =>
  useIsMutating({ mutationKey: SWITCH_BRANCH_MUTATION_KEY }) > 0;
