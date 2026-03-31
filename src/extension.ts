import * as vscode from 'vscode';
import { AgentManagerPanel } from './agentManagerPanel';
import { ProjectTreeProvider } from './projectTreeProvider';

export function activate(context: vscode.ExtensionContext): void {
  const treeProvider = new ProjectTreeProvider();
  vscode.window.registerTreeDataProvider('claudeAgentManager.projectTree', treeProvider);

  // Refresh tree every 30s (matches webview refresh)
  const refreshTimer = setInterval(() => treeProvider.refresh(), 30_000);
  context.subscriptions.push({ dispose: () => clearInterval(refreshTimer) });

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeAgentManager.openPanel', () => {
      AgentManagerPanel.createOrShow(context);
    })
  );
}

export function deactivate(): void {}
