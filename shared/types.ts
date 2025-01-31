import { ChatDto } from "../server/src/db/models/chats";
import { WidgetDto } from "../server/src/db/models/widgets";
import { ReplyMsgKind } from "../server/src/vendors/chat_engine";

export type WsInputMessage =
  | {
      type: "POST_MESSAGE";
      payload: {
        content: string;
        image?: {
          data: string;
          type: string;
        };
        chatId: string;
      };
    }
  | {
      type: "START_CHAT";
      payload: {
        profile: string;
        dbUuid: string;
      };
    }
  | {
      type: "DELETE_CHAT";
      payload: {
        chatId: string;
      };
    }
  | {
      type: "RUN_WIDGET";
      payload: {
        uuid: string;
      };
    };

export type WsOutputMessage =
  | {
      type: "CHAT_STARTED";
      payload: ChatDto;
    }
  | {
      type: "CHAT_PARTIAL_REPLY";
      payload: {
        chatId: string;
        content: string;
        kind: ReplyMsgKind;
      };
    }
  | {
      type: "CHAT_REPLY_FINISH";
      payload: {
        chatId: string;
      };
    }
  | {
      type: "CHAT_ERROR";
      payload: {
        chatId: string;
        error: string;
      };
    }
  | {
      type: "GENERAL_ERROR";
      payload: {
        error: string;
      };
    }
  | {
      type: "WIDGET_UPDATED";
      payload: {
        widget: WidgetDto;
      };
    };
