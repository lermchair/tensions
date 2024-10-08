interface TensionPODData {
    forceA: {
        type: "string";
        value: string;
    };
    forceB: {
        type: "string";
        value: string;
    };
    zupass_title: {
        type: "string";
        value: string;
    };
    zupass_image_url: {
        type: "string";
        value: string;
    };
    source: {
        type: "string";
        value: string;
    };
    zupass_display: {
        type: "string";
        value: "collectable";
    };
    owner: {
        type: "cryptographic";
        value: bigint;
    };
    timestamp: {
        type: "int";
        value: bigint;
    };
}
interface TensionData {
    forceA: string;
    forceB: string;
    base64Image: string;
    imageFileName: string;
    source: string | undefined;
}
interface TensionPODRequest extends TensionData {
    podFolder: string;
    podEntries: string;
    owner?: bigint;
}
interface TensionPOD extends TensionPODRequest {
    serializedPOD: string;
}
interface PODMintRequest {
    pod: string;
}

export type { PODMintRequest, TensionData, TensionPOD, TensionPODData, TensionPODRequest };
