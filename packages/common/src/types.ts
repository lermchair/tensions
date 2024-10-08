export interface TensionPODData {
  forceA: { type: "string"; value: string };
  forceB: { type: "string"; value: string };
  zupass_title: { type: "string"; value: string };
  zupass_image_url: { type: "string"; value: string };
  author: { type: "string"; value: string };
  idea_source: { type: "string"; value: string };
  tradeoff: { type: "int"; value: Number };
  details: {type: "string"; value: string};
  lighthouse: { type: "string"; value: string };
  zupass_display: { type: "string"; value: "collectable" };
  zupass_description: { type: "string"; value: string };
  owner: { type: "cryptographic"; value: bigint } | undefined;
  timestamp: { type: "int"; value: bigint } | undefined;
}

export interface TensionData {
  forceA: string;
  forceB: string;
  base64Image: string;
  imageFileName: string;
  author: string;
  tradeoff: Number;
  details: string;
  lighthouse: string;
  ideaSource: string;
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
  pod: string;
}
