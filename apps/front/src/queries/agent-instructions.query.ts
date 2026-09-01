import { useMutation, useQueryClient } from "@tanstack/react-query";

type SendInstructionsInput = {
  instruction: string;
  images: Array<{
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
  }>;
};

export const useSendAgentInstructions = (agentRunId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendInstructionsInput) =>
      sendInstructions(agentRunId, input),
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

async function sendInstructions(
  agentRunId: string,
  input: SendInstructionsInput,
) {
  const response = await fetch(
    `/api/agent-runs/${encodeURIComponent(agentRunId)}/instructions`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to send agent instructions.");
  }
}
