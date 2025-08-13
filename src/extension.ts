import * as vscode from 'vscode';
import * as ui from './common/UI';
import { SqsTreeView } from './sqs/SqsTreeView';
import { SqsTreeItem } from './sqs/SqsTreeItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Sqs Extension activation started');

	let treeView:SqsTreeView = new SqsTreeView(context);

	vscode.commands.registerCommand('SnsTreeView.Refresh', () => {
		treeView.Refresh();
	});

	vscode.commands.registerCommand('SnsTreeView.Filter', () => {
		treeView.Filter();
	});

	vscode.commands.registerCommand('SnsTreeView.ShowOnlyFavorite', () => {
		treeView.ShowOnlyFavorite();
	});

	vscode.commands.registerCommand('SnsTreeView.ShowHiddenNodes', () => {
		treeView.ShowHiddenNodes();
	});

	vscode.commands.registerCommand('SnsTreeView.AddToFav', (node: SqsTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('SnsTreeView.DeleteFromFav', (node: SqsTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('SnsTreeView.HideNode', (node: SqsTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('SnsTreeView.UnHideNode', (node: SqsTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('SnsTreeView.AddTopic', () => {
		treeView.AddQueue();
	});

	vscode.commands.registerCommand('SnsTreeView.RemoveTopic', (node: SqsTreeItem) => {
		treeView.RemoveQueue(node);
	});

	vscode.commands.registerCommand('SnsTreeView.Goto', (node: SqsTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('SnsTreeView.SelectAwsProfile', (node: SqsTreeItem) => {
		treeView.SelectAwsProfile(node);
	});

	vscode.commands.registerCommand('SnsTreeView.TestAwsConnection', () => {
		treeView.TestAwsConnection();
	});

	vscode.commands.registerCommand('SnsTreeView.UpdateAwsEndPoint', () => {
		treeView.UpdateAwsEndPoint();
	});

	vscode.commands.registerCommand('SnsTreeView.Donate', () => {
		treeView.Donate();
	});

	vscode.commands.registerCommand('SnsTreeView.BugAndNewFeature', () => {
		treeView.BugAndNewFeature();
	});

	vscode.commands.registerCommand('SnsTreeView.SendMessage', (node: SqsTreeItem) => {
		treeView.SendMessage(node);
	});

	vscode.commands.registerCommand('SnsTreeView.SnsView', (node: SqsTreeItem) => {
		treeView.SqsView(node);
	});

	vscode.commands.registerCommand('SnsTreeView.RemoveMessageFilePath', async (node: SqsTreeItem) => {
		await treeView.RemoveMessageFilePath(node);
	});

	vscode.commands.registerCommand('SnsTreeView.AddMessageFilePath', async (node: SqsTreeItem) => {
		await treeView.AddMessageFilePath(node);
	});

	ui.logToOutput('Aws Sqs Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Sqs is now de-active!');
}
