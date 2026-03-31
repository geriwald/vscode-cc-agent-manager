export type SessionStatus = 'active' | 'thinking' | 'waiting' | 'recent' | 'idle';

export interface BashCommand {
  command: string;
  description?: string;
  timestamp?: string;
  sessionId: string;
  isError?: boolean;
  output?: string;
}

export interface SubAgent {
  agentId: string;
  slug?: string;
  firstPrompt?: string;
  firstTimestamp?: string;
  lastTimestamp?: string;
  messageCount: number;
  lastMessageRole?: string;
  status: SessionStatus;
  toolCounts: Record<string, number>;
  userChars: number;
  assistantLines: number;
  codeLines: number;
  bashCommands: BashCommand[];
}

export interface ClaudeSession {
  sessionId: string;
  cwd?: string;
  gitBranch?: string;
  firstPrompt?: string;
  firstTimestamp?: string;
  lastTimestamp?: string;
  messageCount: number;
  subAgents: SubAgent[];
  lastMessageRole?: string;
  status: SessionStatus;
  toolCounts: Record<string, number>;
  userChars: number;
  assistantLines: number;
  codeLines: number;
  bashCommands: BashCommand[];
}

export interface ClaudeProject {
  key: string;
  path: string;
  displayName: string;
  sessions: ClaudeSession[];
  lastActivity?: string;
  peacockColor?: string;
}

export interface MessageBlock {
  type: 'text' | 'tool';
  content: string;
  /** Tool-specific fields (present when type === 'tool') */
  toolUseId?: string;
  description?: string;
  input?: string;
  output?: string;
  isError?: boolean;
  /** Short preview shown in collapsed tool badge */
  preview?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  blocks: MessageBlock[];
  timestamp?: string;
}

export interface ManagerSettings {
  soundEnabled: boolean;
  soundRepeatSec: number;
  exportTemplate: string;
  exportLinkStyle: 'markdown' | 'wiki';
  exportToolFormat: 'compact' | 'expanded' | 'omit';
}
