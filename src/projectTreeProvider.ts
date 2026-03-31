import * as vscode from 'vscode';
import { readClaudeProjects } from './claudeReader';
import { ClaudeProject, ClaudeSession } from './types';

type TreeNode = ProjectNode | SessionNode;

class ProjectNode extends vscode.TreeItem {
  constructor(public readonly project: ClaudeProject) {
    super(project.displayName, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = project.sessions.length + ' session' + (project.sessions.length !== 1 ? 's' : '');
    this.tooltip = project.path;
    this.contextValue = 'project';
    this.iconPath = new vscode.ThemeIcon('folder');
  }
}

class SessionNode extends vscode.TreeItem {
  constructor(
    public readonly session: ClaudeSession,
    public readonly projectKey: string,
  ) {
    super(
      session.firstPrompt?.slice(0, 60) || session.sessionId.slice(0, 8),
      vscode.TreeItemCollapsibleState.None,
    );
    this.description = session.status;
    this.tooltip = session.firstPrompt || session.sessionId;
    this.contextValue = 'session';
    this.iconPath = new vscode.ThemeIcon(statusIcon(session.status));
    this.command = {
      command: 'claudeAgentManager.openPanel',
      title: 'Open session',
    };
  }
}

function statusIcon(status: string): string {
  switch (status) {
    case 'active': return 'debug-start';
    case 'thinking': return 'loading~spin';
    case 'waiting': return 'bell';
    case 'recent': return 'clock';
    default: return 'circle-outline';
  }
}

export class ProjectTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _projects: ClaudeProject[] = [];

  refresh(): void {
    this._projects = readClaudeProjects();
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      if (this._projects.length === 0) this._projects = readClaudeProjects();
      return this._projects.map((p) => new ProjectNode(p));
    }
    if (element instanceof ProjectNode) {
      return element.project.sessions.map((s) => new SessionNode(s, element.project.key));
    }
    return [];
  }
}
