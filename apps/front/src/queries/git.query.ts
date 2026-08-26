import { useQuery } from "@tanstack/react-query";
import { useEden } from "../lib/eden";

export const useGetBranches = () => {
  const eden = useEden();
  return useQuery(eden.api.git.branches.get.queryOptions());
};
