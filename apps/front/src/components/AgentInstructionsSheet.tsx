import {
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import {
  ImageIcon,
  LoaderCircle,
  SendIcon,
  XIcon,
} from "lucide-react";
import { useSendAgentInstructions } from "../queries/agent-instructions.query";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";
import { MAX_IMAGE_ATTACHMENTS, useImageAttachments } from "./useImageAttachments";

export function AgentInstructionsSheet({
  agentRunId,
  title,
  open,
  onOpenChange,
}: {
  agentRunId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendInstructions = useSendAgentInstructions(agentRunId);
  const attachments = useImageAttachments();

  const submit = () => {
    const trimmedInstruction = instruction.trim();
    if (!trimmedInstruction) return;

    sendInstructions.mutate(
      {
        instruction: trimmedInstruction,
        images: attachments.images.map(({ mediaType, data }) => ({
          mediaType,
          data,
        })),
      },
      {
        onSuccess: () => {
          setInstruction("");
          attachments.clear();
          onOpenChange(false);
        },
      },
    );
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files);
    if (files.length > 0) void attachments.addFiles(files);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || !event.ctrlKey) return;

    event.preventDefault();
    submit();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Give new instructions</SheetTitle>
          <SheetDescription className="truncate">{title}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
          <Textarea
            className="min-h-32 resize-none"
            value={instruction}
            placeholder="Describe what you want the agent to change..."
            onChange={(event) => setInstruction(event.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            disabled={sendInstructions.isPending}
          />

          {attachments.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.images.map((image) => (
                <div
                  key={image.id}
                  className="relative size-16 overflow-hidden rounded-md border"
                >
                  <img
                    src={image.previewUrl}
                    alt={image.name}
                    className="size-full object-cover"
                  />
                  <Button
                    className="absolute right-0.5 top-0.5 size-5"
                    variant="secondary"
                    size="icon-xs"
                    aria-label={`Remove ${image.name}`}
                    onClick={() => attachments.removeImage(image.id)}
                  >
                    <XIcon className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {attachments.error && (
            <p className="text-xs text-destructive">{attachments.error}</p>
          )}
          {sendInstructions.error && (
            <p className="text-xs text-destructive">Failed to send the instructions.</p>
          )}

          <div className="mt-auto flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={
                attachments.images.length >= MAX_IMAGE_ATTACHMENTS ||
                sendInstructions.isPending
              }
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon />
              Add images
            </Button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={(event) => {
                void attachments.addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            <Button
              size="sm"
              disabled={!instruction.trim() || sendInstructions.isPending}
              onClick={submit}
            >
              {sendInstructions.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <SendIcon />
              )}
              Send
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
