/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { SqsTreeItem, TreeItemType } from './SqsTreeItem';
import { SqsTreeView } from './SqsTreeView';
export class SqsTreeDataProvider implements vscode.TreeDataProvider<SqsTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<SqsTreeItem | undefined | void> = new vscode.EventEmitter<SqsTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<SqsTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	SqsNodeList: SqsTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.SqsNodeList.length === 0){ this.LoadSqsNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddQueue(Region:string, TopicArn:string){
		for(var item of SqsTreeView.Current.QueueList)
		{
			if(item.Region === Region && item.TopicArn === TopicArn)
			{
				return;
			}
		}
		
		SqsTreeView.Current.QueueList.push({Region: Region, TopicArn: TopicArn});
		this.AddNewSqsNode(Region, TopicArn);
		this.Refresh();
	}

	RemoveQueue(Region:string, TopicArn:string){
		for(var i=0; i<SqsTreeView.Current.QueueList.length; i++)
		{
			if(SqsTreeView.Current.QueueList[i].Region === Region && SqsTreeView.Current.QueueList[i].TopicArn === TopicArn)
			{
				SqsTreeView.Current.QueueList.splice(i, 1);
				break;
			}
		}

		this.RemoveSqsNode(Region, TopicArn);
		this.Refresh();
	}
	
	LoadSqsNodeList(){
		this.SqsNodeList = [];
		
		for(var item of SqsTreeView.Current.QueueList)
		{
			let treeItem = this.NewSqsNode(item.Region, item.TopicArn);

			this.SqsNodeList.push(treeItem);
		}
	}

	AddNewSqsNode(Region:string, TopicArn:string){
		if (this.SqsNodeList.some(item => item.Region === Region && item.QueueArn === TopicArn)) { return; }

		let treeItem = this.NewSqsNode(Region, TopicArn);
		this.SqsNodeList.push(treeItem);
	}

	RemoveSqsNode(Region:string, TopicArn:string){
		for(var i=0; i<this.SqsNodeList.length; i++)
		{
			if(this.SqsNodeList[i].Region === Region && this.SqsNodeList[i].QueueArn === TopicArn)
			{
				this.SqsNodeList.splice(i, 1);
				break;
			}
		}
	}

	GetQueueName(TopicArn:string):string{
		const topicName = TopicArn.split(":").pop();
		if(!topicName) { return TopicArn; }
		return topicName;
	}

	private NewSqsNode(Region: string, TopicArn: string) : SqsTreeItem
	{
		let topicName = this.GetQueueName(TopicArn);
		let treeItem = new SqsTreeItem(topicName, TreeItemType.Queue);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.QueueArn = TopicArn;

		let pubItem = new SqsTreeItem("Send", TreeItemType.PublishGroup);
		pubItem.QueueArn = treeItem.QueueArn;
		pubItem.Region = treeItem.Region;
		pubItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		pubItem.Parent = treeItem;
		treeItem.Children.push(pubItem);

		let pubJson = new SqsTreeItem("Adhoc", TreeItemType.PublishAdhoc);
		pubJson.QueueArn = treeItem.QueueArn;
		pubJson.Region = treeItem.Region;
		pubJson.Parent = pubItem;
		pubItem.Children.push(pubJson);

		for(var i=0; i<SqsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SqsTreeView.Current.MessageFilePathList[i].Region === Region 
				&& SqsTreeView.Current.MessageFilePathList[i].TopicArn === TopicArn)
			{
				this.AddNewMessagePathNode(pubItem, SqsTreeView.Current.MessageFilePathList[i].MessageFilePath);
			}
		}

		let subItem = new SqsTreeItem("Subscriptions", TreeItemType.SubscriptionGroup);
		subItem.QueueArn = treeItem.QueueArn;
		subItem.Region = treeItem.Region;
		subItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		subItem.Parent = treeItem;
		treeItem.Children.push(subItem);

		return treeItem;
	}

	AddMessageFilePath(node: SqsTreeItem, MessageFilePath:string){
		
		for(var i=0; i<SqsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SqsTreeView.Current.MessageFilePathList[i].Region === node.Region 
				&& SqsTreeView.Current.MessageFilePathList[i].TopicArn === node.QueueArn
				&& SqsTreeView.Current.MessageFilePathList[i].MessageFilePath === MessageFilePath)
			{
				return;
			}
		}
		this.AddNewMessagePathNode(node, MessageFilePath);
		SqsTreeView.Current.MessageFilePathList.push({Region: node.Region, TopicArn: node.QueueArn, MessageFilePath: MessageFilePath});
		this.Refresh();
	}

	private AddNewMessagePathNode(node: SqsTreeItem, MessageFilePath: string) {
		let fileName = MessageFilePath.split("/").pop();
		if (!fileName) { fileName = MessageFilePath; }

		let treeItem = new SqsTreeItem(fileName, TreeItemType.PublishFile);
		treeItem.Region = node.Region;
		treeItem.QueueArn = node.QueueArn;
		treeItem.MessageFilePath = MessageFilePath;
		treeItem.Parent = node;
		node.Children.push(treeItem);
	}

	RemoveMessageFilePath(node: SqsTreeItem){
		if(!node.Parent) { return; }

		for(var i=0; i<SqsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SqsTreeView.Current.MessageFilePathList[i].Region === node.Region 
				&& SqsTreeView.Current.MessageFilePathList[i].TopicArn === node.QueueArn
				&& SqsTreeView.Current.MessageFilePathList[i].MessageFilePath === node.MessageFilePath
			)
			{
				SqsTreeView.Current.MessageFilePathList.splice(i, 1);
			}
		}
		
		let parentNode = node.Parent;
		for(var i=0; i<parentNode.Children.length; i++)
		{
			if(parentNode.Children[i].Region === node.Region 
				&& parentNode.Children[i].QueueArn === node.QueueArn
				&& parentNode.Children[i].MessageFilePath === node.MessageFilePath
			)
			{
				parentNode.Children.splice(i, 1);
			}
		}
		this.Refresh();
	}

	getChildren(node: SqsTreeItem): Thenable<SqsTreeItem[]> {
		let result:SqsTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetSqsNodes());
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetSqsNodes(): SqsTreeItem[]{
		var result: SqsTreeItem[] = [];
		for (var node of this.SqsNodeList) {
			if (SqsTreeView.Current && SqsTreeView.Current.FilterString && !node.IsFilterStringMatch(SqsTreeView.Current.FilterString)) { continue; }
			if (SqsTreeView.Current && SqsTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (SqsTreeView.Current && !SqsTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: SqsTreeItem): SqsTreeItem {
		return element;
	}
}

export enum ViewType{
	Sqs = 1
}