import { useEden } from "../lib/eden";
import { useQuery } from "@tanstack/react-query";

export const useGetHealth = () => {
  const eden = useEden();
  return useQuery(eden.api.health.get.queryOptions());
};
