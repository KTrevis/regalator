import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useEden } from "../lib/eden";

const BRANCH_MUTATION_KEY = ["git", "branch"];
const PULL_BRANCH_MUTATION_KEY = [...BRANCH_MUTATION_KEY, "pull"];
const SWITCH_BRANCH_MUTATION_KEY = [...BRANCH_MUTATION_KEY, "switch"];

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

export const usePullBranch = () => {
  const eden = useEden();
  const queryClient = useQueryClient();

  return useMutation({
    ...eden.api.git.branch.pull.post.mutationOptions({
      onSuccess: ({ branch }) => {
        queryClient.invalidateQueries();
        toast.success("Branch pulled", {
          description: `Pulled ${branch} from origin.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to pull branch", {
          description: error.message,
        });
      },
    }),
    mutationKey: PULL_BRANCH_MUTATION_KEY,
  });
};

export const useIsUpdatingBranch = () =>
  useIsMutating({ mutationKey: BRANCH_MUTATION_KEY }) > 0;

export const useIsSwitchingBranch = () =>
  useIsMutating({ mutationKey: SWITCH_BRANCH_MUTATION_KEY }) > 0;
