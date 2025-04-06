export type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  pattern?: string;
  properties?: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
  items?: ToolParameterProperty;
}

export interface ToolParameters {
  type: string;
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface Tool {
  type: "function";
  name: string;
  description: string;
  parameters: ToolParameters;
}

export interface PersonalityAndTone {
  identity: string;
  task: string;
  demeanor: string;
  tone: string;
  levelOfEnthusiasm: string;
  levelOfFormality: string;
  levelOfEmotion: string;
  fillerWords: string;
  pacing: string;
  otherDetails: string;
}

export interface AgentConfig {
  name: string;
  voice?: string;
  publicDescription: string;
  instructions: string;
  tools: Tool[];
  personalityAndTone?: PersonalityAndTone;
  conversationStates?: Array<{
    id: string;
    description: string;
    instructions: string[];
    examples: string[];
    transitions: Array<{
      nextStep: string;
      condition: string;
    }>;
  }>;
  toolLogic?: Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (args: any, transcriptLogsFiltered: TranscriptItem[]) => Promise<any> | any
  >;
}

export interface TranscriptItem {
  itemId: string;
  type: "MESSAGE" | "EVENT";
  role?: "user" | "assistant";
  content?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
  expanded: boolean;
  timestamp: string;
  createdAtMs: number;
  status: "IN_PROGRESS" | "DONE";
}

export interface ServerEvent {
  type: string;
  event_id?: string;
  item_id?: string;
  transcript?: string;
  delta?: string;
  session?: {
    id?: string;
  };
  item?: {
    id?: string;
    object?: string;
    type?: string;
    status?: string;
    name?: string;
    arguments?: string;
    role?: "user" | "assistant";
    content?: {
      type?: string;
      transcript?: string | null;
      text?: string;
    }[];
  };
  response?: {
    output?: {
      type?: string;
      name?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      arguments?: any;
      call_id?: string;
    }[];
    status_details?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error?: any;
    };
  };
}

export interface LoggedEvent {
  id: number;
  direction: "client" | "server";
  expanded: boolean;
  timestamp: string;
  eventName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventData: Record<string, any>;
}
