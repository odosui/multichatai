import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import { ChatEngine, ReplyMsgKind } from "./chat_engine";

const MAX_TOKENS = 1024;

export class AnthropicChat implements ChatEngine {
  private model: string;
  private client: Anthropic;
  private messages: MessageParam[] = [];
  private system: string;

  private listeners: ((msg: string, kind: ReplyMsgKind) => void)[] = [];
  private finishListeners: ((
    finishedMessage: string,
    reasoning: string
  ) => void)[] = [];
  private errorListeners: ((err: string) => void)[] = [];

  constructor(
    apiKey: string,
    model: string,
    systemMsg: string,
    msgs: { role: "assistant" | "user"; content: string }[] = []
  ) {
    this.model = model;
    this.system = systemMsg;
    this.messages.push(...msgs);

    this.client = new Anthropic({
      apiKey,
    });
  }

  async postMessage(input: string, file?: { data: string; type: string }) {
    this.messages.push(user(input, file));
    let msg = "";

    this.client.messages
      .stream({
        messages: this.messages,
        model: this.model,
        max_tokens: MAX_TOKENS,
        system: this.system,
      })
      .on("text", (p) => {
        // collect regular message
        if (p) {
          this.listeners.forEach((listener) => listener(p, "regular"));
          msg += p;
        }
      })
      .on("end", () => {
        // notify listeners
        this.finishListeners.forEach((l) => l(msg, ""));
        this.messages.push(assistant(msg));
      })
      .on("error", (err) => {
        this.errorListeners.forEach((l) => l(err.message));
      });
  }

  async destroy() {
    this.messages = [];
    this.listeners = [];
    this.finishListeners = [];
    this.errorListeners = [];
  }

  // for plugins
  async oneTimeRun(input: string) {
    const res = await this.client.messages.create({
      messages: [user(input)],
      model: this.model,
      max_tokens: MAX_TOKENS,
      system: this.system,
    });

    const c = res.content[0];

    if (c.type === "text") {
      return c.text;
    }

    // ??? implement me
    return "";
  }

  // listeners

  onPartialReply(listener: (msg: string, kind: ReplyMsgKind) => void) {
    this.listeners.push(listener);
  }

  onReplyFinish(l: (finishedMessage: string, reasoning: string) => void) {
    this.finishListeners.push(l);
  }

  onError(l: (err: string) => void) {
    this.errorListeners.push(l);
  }
}

// helpers

function user(
  content: string,
  file?: {
    data: string;
    type: string;
  }
): MessageParam {
  if (!file) {
    return {
      role: "user",
      content,
    };
  }

  return {
    role: "user",
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: file.type as "image/png" | "image/jpeg",
          data: file.data,
        },
      },
      {
        type: "text",
        text: content,
      },
    ],
  };
}

function assistant(content: string): MessageParam {
  return {
    role: "assistant",
    content,
  };
}
