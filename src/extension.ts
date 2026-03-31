import * as vscode from 'vscode';
import { AgentManagerPanel } from './agentManagerPanel';
import { ActiveSessionsProvider, ProjectTreeProvider } from './projectTreeProvider';

export function activate(context: vscode.ExtensionContext): void {
  const activeProvider = new ActiveSessionsProvider();
  const treeProvider = new ProjectTreeProvider();
  vscode.window.registerTreeDataProvider('claudeAgentManager.activeSessions', activeProvider);
  vscode.window.registerTreeDataProvider('claudeAgentManager.projectTree', treeProvider);

  // Refresh both trees every 30s (matches webview refresh)
  const refreshTimer = setInterval(() => { activeProvider.refresh(); treeProvider.refresh(); }, 30_000);
  context.subscriptions.push({ dispose: () => clearInterval(refreshTimer) });

  const setFilterContext = (filter: string, active: boolean) => {
    vscode.commands.executeCommand('setContext', `claudeAgentManager.filter.${filter}`, active);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeAgentManager.openPanel', () => {
      AgentManagerPanel.createOrShow(context);
    }),
    vscode.commands.registerCommand('claudeAgentManager.refreshTree', () => {
      activeProvider.refresh();
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('claudeAgentManager.filterAll', () => {
      treeProvider.clearFilters();
    }),
    vscode.commands.registerCommand('claudeAgentManager.filterActive', () => {
      setFilterContext('active', treeProvider.toggleFilter('active'));
    }),
    vscode.commands.registerCommand('claudeAgentManager.filterWaiting', () => {
      setFilterContext('waiting', treeProvider.toggleFilter('waiting'));
    }),
    vscode.commands.registerCommand('claudeAgentManager.filterPinned', () => {
      setFilterContext('pinned', treeProvider.toggleFilter('pinned'));
    }),
  );
}

export function deactivate(): void {}
