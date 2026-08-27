import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@regalator/back/type";
import {
  createEdenTanStackQuery,
  type CreateEdenTanStackQueryResult,
  type EdenOptionsProxy,
} from "eden-tanstack-react-query";

export type EdenClient = Treaty.Create<App>;
export type ApiClient = EdenOptionsProxy<App>;
export type EdenTanStackQuery = CreateEdenTanStackQueryResult<App>;

export const getApiBaseUrl = (): string =>
  import.meta.env.VITE_API_URL ?? window.location.origin;

export const createEdenClient = (baseUrl = getApiBaseUrl()): EdenClient =>
  treaty<App>(baseUrl);

const edenTanStackQuery: EdenTanStackQuery = createEdenTanStackQuery<App>();

export const edenClient: EdenClient = createEdenClient();
export const EdenProvider: EdenTanStackQuery["EdenProvider"] =
  edenTanStackQuery.EdenProvider;
export const useEden: () => ApiClient = edenTanStackQuery.useEden;
export const useEdenClient: () => EdenClient = edenTanStackQuery.useEdenClient;
