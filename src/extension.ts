import * as vscode from 'vscode';
import { AgentManagerPanel } from './agentManagerPanel';
import { ActiveSessionsProvider, WaitingSessionsProvider, PinnedProjectsProvider, ProjectTreeProvider } from './projectTreeProvider';

export function activate(context: vscode.ExtensionContext): void {
  const activeProvider = new ActiveSessionsProvider();
  const waitingProvider = new WaitingSessionsProvider();
  const pinnedProvider = new PinnedProjectsProvider();
  const treeProvider = new ProjectTreeProvider();
  vscode.window.registerTreeDataProvider('claudeAgentManager.activeSessions', activeProvider);
  vscode.window.registerTreeDataProvider('claudeAgentManager.waitingSessions', waitingProvider);
  vscode.window.registerTreeDataProvider('claudeAgentManager.pinnedProjects', pinnedProvider);
  vscode.window.registerTreeDataProvider('claudeAgentManager.projectTree', treeProvider);

  const refreshAll = () => { activeProvider.refresh(); waitingProvider.refresh(); pinnedProvider.refresh(); treeProvider.refresh(); };
  const refreshTimer = setInterval(refreshAll, 30_000);
  context.subscriptions.push({ dispose: () => clearInterval(refreshTimer) });

  const setFilterContext = (filter: string, active: boolean) => {
    vscode.commands.executeCommand('setContext', `claudeAgentManager.filter.${filter}`, active);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeAgentManager.openPanel', () => {
      AgentManagerPanel.createOrShow(context);
    }),
    vscode.commands.registerCommand('claudeAgentManager.refreshTree', () => {
      refreshAll();
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
