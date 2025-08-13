/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { SQSClient, ListQueuesCommand } from "@aws-sdk/client-sqs";
import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join, basename, extname, dirname } from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as SqsTreeView from '../sqs/SqsTreeView';
import * as fs from 'fs';
import * as archiver from 'archiver';

export async function GetCredentials() {
  let credentials;

  try {
    if (SqsTreeView.SqsTreeView.Current) {
      process.env.AWS_PROFILE = SqsTreeView.SqsTreeView.Current.AwsProfile ;
    }
    // Get credentials using the default provider chain.
    const provider = fromNodeProviderChain({ignoreCache: true});
    credentials = await provider();

    if (!credentials) {
      throw new Error("Aws credentials not found !!!");
    }

    ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
    return credentials;
  } catch (error: any) {
    ui.showErrorMessage("Aws Credentials Not Found !!!", error);
    ui.logToOutput("GetCredentials Error !!!", error);
    return credentials;
  }
}

async function GetSQSClient(region: string) {
  const credentials = await GetCredentials();
  
  const sqs = new SQSClient({
    region,
    credentials,
    endpoint: SqsTreeView.SqsTreeView.Current?.AwsEndPoint,
  });
  
  return sqs;
}

export async function GetSqsQueueList(
  region: string,
  QueName?: string
): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    const snd = await GetSQSClient(region);
    
    let allQues = [];
    let marker: string | undefined = undefined;
    
    // Continue fetching pages until no NextMarker is returned
    do {
      const command:ListQueuesCommand = new ListQueuesCommand({NextToken: marker,});
      const queList = await snd.send(command);

      if (queList.QueueUrls) {
        allQues.push(...queList.QueueUrls);
      }
      
      // Update marker to the next page (if present)
      marker = queList.NextToken;
    } while (marker);

    let matchingTopics;
    if (QueName) {
      matchingTopics = allQues.filter(
        (que) =>
          que.includes(QueName) || QueName.length === 0
      );
    } else {
      matchingTopics = allQues;
    }

    // Extract the function names into the result
    if (matchingTopics && matchingTopics.length > 0) {
      matchingTopics.forEach((que) => {
        if (que) result.result.push(que!);
      });
    }

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetSqsTopicList Error !!!", error);
    ui.logToOutput("api.GetSqsTopicList Error !!!", error);
    return result;
  }
}

export function isJsonString(jsonString: string): boolean {
  try {
    var json = ParseJson(jsonString);
    return (typeof json === 'object');
  } catch (e) {
    return false;
  }
}
export function ParseJson(jsonString: string) {
  return JSON.parse(jsonString);
}

import {
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";


export async function SendMessage(
  Region: string,
  QueueUrl: string,
  Message: string
): Promise<MethodResult<SendMessageCommandOutput>> {
  let result: MethodResult<SendMessageCommandOutput> = new MethodResult<SendMessageCommandOutput>();

  try {
    const sqs = await GetSQSClient(Region);

    const param: SendMessageCommandInput = {
      QueueUrl: QueueUrl,
      MessageBody: Message
    };

    const command = new SendMessageCommand(param);
    const response = await sqs.send(command);

    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.SendMessage Error !!!", error);
    ui.logToOutput("api.SendMessage Error !!!", error);
    return result;
  }
}

import {
  GetQueueAttributesCommand,
  GetQueueAttributesCommandInput,
  GetQueueAttributesCommandOutput,
} from "@aws-sdk/client-sqs";

export async function GetQueueAttributes(
  Region: string,
  QueueUrl: string
): Promise<MethodResult<GetQueueAttributesCommandOutput>> {
  let result: MethodResult<GetQueueAttributesCommandOutput> = new MethodResult<GetQueueAttributesCommandOutput>();

  try {
    const sqs = await GetSQSClient(Region);

    const command = new GetQueueAttributesCommand({
      QueueUrl: QueueUrl,
    });

    const response = await sqs.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetTopicAttributes Error !!!", error);
    ui.logToOutput("api.GetTopicAttributes Error !!!", error);
    return result;
  }
}

export async function ZipTextFile(inputPath: string, outputZipPath?: string): Promise<MethodResult<string>> {
  let result:MethodResult<string> = new MethodResult<string>();

  try 
  {
    if(!outputZipPath)
    {
      outputZipPath = dirname(inputPath) + "/" + basename(inputPath) + ".zip"
    }

    // Delete the output zip file if it already exists
    if (fs.existsSync(outputZipPath)) {
      fs.unlinkSync(outputZipPath);
    }

    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level
    });

    archive.pipe(output);

    if (fs.lstatSync(inputPath).isDirectory()) {
      archive.directory(inputPath, false);
    } else {
      archive.file(inputPath, { name: basename(inputPath) });
    }

    archive.finalize();

    result.result = outputZipPath;
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.ZipTextFile Error !!!', error);
    ui.logToOutput("api.ZipTextFile Error !!!", error); 
    return result;
  }
}

import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
async function GetSTSClient(region: string) {
  const credentials = await GetCredentials();
  const iamClient = new STSClient(
    {
      region,
      credentials,
      endpoint: SqsTreeView.SqsTreeView.Current?.AwsEndPoint,
    }
  );
  return iamClient;
}

export async function TestAwsCredentials(): Promise<MethodResult<boolean>> {
  let result: MethodResult<boolean> = new MethodResult<boolean>();

  try {
    const credentials = await GetCredentials();

    result.isSuccessful = true;
    result.result = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}
export async function TestAwsConnection(Region: string="us-east-1"): Promise<MethodResult<boolean>> {
  let result: MethodResult<boolean> = new MethodResult<boolean>();

  try {
    const sts = await GetSTSClient(Region);

    const command = new GetCallerIdentityCommand({});
    const data = await sts.send(command);

    result.isSuccessful = true;
    result.result = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}


export async function GetAwsProfileList(): Promise<MethodResult<string[]>> {
  ui.logToOutput("api.GetAwsProfileList Started");

  let result:MethodResult<string[]> = new MethodResult<string[]>();

  try 
  {
    let profileData = await getIniProfileData();
    
    result.result = Object.keys(profileData);
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetAwsProfileList Error !!!', error);
    ui.logToOutput("api.GetAwsProfileList Error !!!", error); 
    return result;
  }
}

export async function getIniProfileData(init: SourceProfileInit = {}):Promise<ParsedIniData>
{
    const profiles = await parseKnownFiles(init);
    return profiles;
}

export const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";

export const getHomeDir = (): string => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${sep}` } = process.env;
  
    if (HOME) { return HOME; }
    if (USERPROFILE) { return USERPROFILE; } 
    if (HOMEPATH) { return `${HOMEDRIVE}${HOMEPATH}`; } 
  
    return homedir();
  };

export const getCredentialsFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");

export const getConfigFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "config");