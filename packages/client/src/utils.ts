import type { ClientConnectionInfo } from "./lib/UseParcnetClient";
import { SerializedPCD } from "@pcd/pcd-types";

export const DEFAULT_CONNECTION_INFO: ClientConnectionInfo = {
  url: "https://develop.zupass.org",
  type: "iframe",
};

export function getConnectionInfo(): ClientConnectionInfo {
  let connectionInfo = DEFAULT_CONNECTION_INFO;
  const storedConnectionInfo = localStorage.getItem("clientConnectionInfo");
  if (storedConnectionInfo) {
    try {
      const parsedConnectionInfo = JSON.parse(
        storedConnectionInfo
      ) as ClientConnectionInfo;
      if (
        parsedConnectionInfo.type === "iframe" &&
        typeof parsedConnectionInfo.url === "string"
      ) {
        connectionInfo = parsedConnectionInfo;
      }
    } catch (e) {
      // JSON parsing failed
      console.error("Failed to parse stored connection info", e);
    }
  }
  return connectionInfo;
}

export interface TensionPODData {
  forceA: { type: "string"; value: string };
  forceB: { type: "string"; value: string };
  base64Image: { type: "string"; value: string };
  source: { type: "string"; value: string };
}

export interface TensionData {
  forceA: string;
  forceB: string;
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
