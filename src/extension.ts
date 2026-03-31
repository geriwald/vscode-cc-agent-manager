import * as vscode from 'vscode';
import { AgentManagerPanel } from './agentManagerPanel';
import { ActiveSessionsProvider, WaitingSessionsProvider, PinnedProjectsProvider, ProjectTreeProvider } from './projectTreeProvider';

export function activate(context: vscode.ExtensionContext): void {
  const activeProvider = new ActiveSessionsProvider();
  const waitingProvider = new WaitingSessionsProvider();
  const pinnedProvider = new PinnedProjectsProvider();
  const treeProvider = new ProjectTreeProvider();
  vscode.window.createTreeView('claudeAgentManager.activeSessions', {
    treeDataProvider: activeProvider,
  });
  vscode.window.createTreeView('claudeAgentManager.waitingSessions', {
    treeDataProvider: waitingProvider,
  });
  vscode.window.createTreeView('claudeAgentManager.pinnedProjects', {
    treeDataProvider: pinnedProvider,
    showCollapseAll: true,
  });
  vscode.window.createTreeView('claudeAgentManager.projectTree', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

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
    vscode.commands.registerCommand('claudeAgentManager.searchTree', async () => {
      const projects = treeProvider.allProjects;
      const items: vscode.QuickPickItem[] = [];
      for (const proj of projects) {
        items.push({
          label: '$(folder) ' + proj.displayName,
          description: proj.path,
          detail: proj.sessions.length + ' session' + (proj.sessions.length !== 1 ? 's' : ''),
        });
        for (const sess of proj.sessions) {
          items.push({
            label: '    $(circle-outline) ' + (sess.firstPrompt?.slice(0, 80) || sess.sessionId.slice(0, 8)),
            description: sess.status,
          });
        }
      }
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Search projects and sessions…',
        matchOnDescription: true,
        matchOnDetail: true,
      });
      if (picked) {
        AgentManagerPanel.createOrShow(context);
      }
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
