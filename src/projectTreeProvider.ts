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
    this.iconPath = statusIcon(session.status);
    this.command = {
      command: 'claudeAgentManager.openPanel',
      title: 'Open session',
    };
  }
}

function statusIcon(status: string): vscode.ThemeIcon {
  switch (status) {
    case 'active': return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.green'));
    case 'thinking': return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.blue'));
    case 'waiting': return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.orange'));
    case 'recent': return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.gray'));
    default: return new vscode.ThemeIcon('circle-outline');
  }
}

export type TreeFilter = 'all' | 'active' | 'waiting' | 'pinned';

class FilteredSessionsProvider implements vscode.TreeDataProvider<SessionNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SessionNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _projects: ClaudeProject[] = [];
  private _statusFilter: (status: string) => boolean;

  constructor(statusFilter: (status: string) => boolean) {
    this._statusFilter = statusFilter;
  }

  setProjects(projects: ClaudeProject[]): void {
    this._projects = projects;
    this._onDidChangeTreeData.fire(undefined);
  }

  refresh(): void {
    this._projects = readClaudeProjects();
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SessionNode): vscode.TreeItem {
    return element;
  }

  getChildren(): SessionNode[] {
    if (this._projects.length === 0) this._projects = readClaudeProjects();
    const nodes: SessionNode[] = [];
    for (const proj of this._projects) {
      for (const sess of proj.sessions) {
        if (this._statusFilter(sess.status)) {
          const node = new SessionNode(sess, proj.key);
          node.description = `${proj.displayName} · ${sess.status}`;
          nodes.push(node);
        }
      }
    }
    return nodes;
  }
}

export class ActiveSessionsProvider extends FilteredSessionsProvider {
  constructor() {
    super((s) => s === 'active' || s === 'thinking');
  }
}

export class WaitingSessionsProvider extends FilteredSessionsProvider {
  constructor() {
    super((s) => s === 'waiting');
  }
}

export class PinnedProjectsProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _projects: ClaudeProject[] = [];
  private _pinnedKeys = new Set<string>();

  set pinnedKeys(keys: Set<string>) {
    this._pinnedKeys = keys;
  }

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
      return this._projects
        .filter((p) => this._pinnedKeys.has(p.key))
        .map((p) => new ProjectNode(p));
    }
    if (element instanceof ProjectNode) {
      return element.project.sessions.map((s) => new SessionNode(s, element.project.key));
    }
    return [];
  }
}

export class ProjectTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _projects: ClaudeProject[] = [];
  private _filters = new Set<TreeFilter>();
  private _pinnedKeys = new Set<string>();

  get allProjects(): ClaudeProject[] {
    if (this._projects.length === 0) this._projects = readClaudeProjects();
    return this._projects;
  }

  get filters(): Set<TreeFilter> { return this._filters; }

  set pinnedKeys(keys: Set<string>) {
    this._pinnedKeys = keys;
  }

  clearFilters(): void {
    this._filters.clear();
    this.refresh();
  }

  toggleFilter(filter: TreeFilter): boolean {
    if (this._filters.has(filter)) {
      this._filters.delete(filter);
    } else {
      this._filters.add(filter);
    }
    this.refresh();
    return this._filters.has(filter);
  }

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
      let projects = this._projects;

      if (this._filters.has('pinned')) {
        projects = projects.filter((p) => this._pinnedKeys.has(p.key));
      }
      if (this._filters.has('active') || this._filters.has('waiting')) {
        projects = projects.filter((p) =>
          p.sessions.some((s) =>
            (this._filters.has('active') && (s.status === 'active' || s.status === 'thinking')) ||
            (this._filters.has('waiting') && s.status === 'waiting')
          )
        );
      }

      return projects.map((p) => new ProjectNode(p));
    }
    if (element instanceof ProjectNode) {
      let sessions = element.project.sessions;

      if (this._filters.has('active') || this._filters.has('waiting')) {
        sessions = sessions.filter((s) =>
          (this._filters.has('active') && (s.status === 'active' || s.status === 'thinking')) ||
          (this._filters.has('waiting') && s.status === 'waiting')
        );
      }

      return sessions.map((s) => new SessionNode(s, element.project.key));
    }
    return [];
  }
}
