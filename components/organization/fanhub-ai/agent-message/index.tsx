"use client";

import ConfirmBlock from "@/components/organization/fanhub-ai/blocks/confirm-block";
import FallbackCard from "@/components/organization/fanhub-ai/blocks/fallback-card";
import LinkBlock from "@/components/organization/fanhub-ai/blocks/link-block";
import ListCard from "@/components/organization/fanhub-ai/blocks/list-card";
import OptionsBlock from "@/components/organization/fanhub-ai/blocks/options-block";
import ReceiptBlock from "@/components/organization/fanhub-ai/blocks/receipt-block";
import RecordCard from "@/components/organization/fanhub-ai/blocks/record-card";
import { config } from "@/config";
import { KEYWORD_FALLBACK_TEXT, STATE_STYLE } from "@/components/organization/fanhub-ai/data";
import { formatBubbleTime } from "@/components/organization/messages/helpers";
import MessageBubble from "@/components/organization/sponsor-messages/message-bubble";
import type {
  AgentOption,
  Block,
  OrgListData,
  OrgRecordData,
  OrgRecordPreviewData,
  ThreadMessage,
} from "@/utils/types/organiser-agent";

export const AGENT_NAME = "FanHub AI";

interface BlockActions {
  // The newest reply, with nothing due: its options and confirmation can be used.
  active: boolean;
  expiredTokens: ReadonlySet<string>;
  onPick: (option: AgentOption) => void;
  onAnswer: (token: string, decision: "CONFIRM" | "CANCEL") => Promise<boolean>;
}

// One block under the reply's text, in the order the agent sent them.
function BlockView({ block, active, expiredTokens, onPick, onAnswer }: BlockActions & { block: Block }) {
  switch (block.type) {
    case "text":
      return <p className="text-sm text-white whitespace-pre-line break-words">{block.text}</p>;
    case "card":
      if (block.template === "ORG_LIST") return <ListCard data={block.data as unknown as OrgListData} />;
      if (block.template === "ORG_RECORD_PREVIEW" || block.template === "ORG_RECORD") {
        return <RecordCard data={block.data as unknown as OrgRecordPreviewData | OrgRecordData} />;
      }
      return <FallbackCard template={block.template} data={block.data} />;
    case "options":
      return <OptionsBlock options={block.options} active={active} onPick={onPick} />;
    case "confirm":
      return <ConfirmBlock block={block} active={active} expired={expiredTokens.has(block.token)} onAnswer={onAnswer} />;
    case "receipt":
      return <ReceiptBlock summary={block.summary} />;
    case "fanhub_link":
    case "external_link":
      return <LinkBlock block={block} />;
    default:
      return null;
  }
}

interface AgentMessageProps extends BlockActions {
  message: ThreadMessage;
}

// One message of the thread: the organiser's on the right; the agent's on the left, its first text block as
// the bubble (the message's `text` repeats it) and every other block under it.
export default function AgentMessage({ message, ...actions }: AgentMessageProps) {
  const time = formatBubbleTime(message.createdAt);
  if (message.role === "USER") return <MessageBubble side="org" who="You" time={time} text={message.text ?? ""} />;

  const blocks = Array.isArray(message.blocks) ? message.blocks : [];
  const textIndex = blocks.findIndex((b) => b.type === "text");
  const first = blocks[textIndex];
  const text = first?.type === "text" ? first.text : (message.text ?? "");
  const rest = blocks.filter((_, i) => i !== textIndex);
  const status = message.state === "BLOCKED" || message.state === "FAILED" ? STATE_STYLE[message.state].label : null;
  // Developers only: this reply means the API answers with its keyword stand-in, not Claude.
  const keywordFallback = config.isDev && text.trim() === KEYWORD_FALLBACK_TEXT;

  return (
    <MessageBubble
      side="agent"
      align="start"
      who={AGENT_NAME}
      time={time}
      text={text}
      status={status}
      className={rest.length > 0 ? "w-full lg:max-w-[760px]" : undefined}
    >
      {rest.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          {rest.map((block, i) => (
            <BlockView key={`${block.type}-${i}`} block={block} {...actions} />
          ))}
        </div>
      )}
      {keywordFallback && (
        <p className="rounded-[6px] bg-[#3d2a12] px-3 py-1.5 text-[11px] text-[#ffc999]">
          Dev: the API is answering with its keyword stand-in, not Claude (ASSISTANT_ORGANISER_MODEL_PROVIDER isn’t
          claude on the server).
        </p>
      )}
    </MessageBubble>
  );
}
