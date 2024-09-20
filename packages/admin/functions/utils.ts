import { SerializedPCD } from "@pcd/pcd-types";

export interface TensionPODData {
  name: { type: "string"; value: string };
  base64Image: { type: "string"; value: string };
  source: { type: "string"; value: string };
}

export interface TensionData {
  name: string;
  base64Image: string;
  imageFileName: string;
  source: string | undefined;
}

export interface TensionPODRequest extends TensionData {
  podFolder: string;
  podEntries: string;
  owner?: bigint;
}

export interface TensionPOD extends TensionPODRequest {
  serializedPOD: string;
}

export interface PODMintRequest {
  templateID: string;
  semaphoreSignaturePCD: SerializedPCD;
}
