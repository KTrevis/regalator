import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@regalator/back/type";
import {
  createEdenTanStackQuery,
  type CreateEdenTanStackQueryResult,
  type EdenOptionsProxy,
} from "eden-tanstack-react-query";

type EdenClient = Treaty.Create<App>;
type ApiClient = EdenOptionsProxy<App>;
type EdenTanStackQuery = CreateEdenTanStackQueryResult<App>;

const edenTanStackQuery: EdenTanStackQuery = createEdenTanStackQuery<App>();

export const edenClient: EdenClient = treaty<App>(window.location.origin);
export const EdenProvider: EdenTanStackQuery["EdenProvider"] =
  edenTanStackQuery.EdenProvider;
export const useEden: () => ApiClient = edenTanStackQuery.useEden;
