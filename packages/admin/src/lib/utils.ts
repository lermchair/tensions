import {
  TensionData,
  TensionPOD,
  TensionPODData,
  TensionPODRequest,
} from "@tensions/common";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const SERVER_URL = import.meta.env.PROD
  ? import.meta.env.VITE_SERVER_URL
  : "http://localhost:3000";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function addOrUpdateTension(
  data: TensionData,
  onSuccess: (updatedTension: TensionPOD) => void,
  id?: string
): Promise<string | undefined> {
  try {
    const url = id ? `${SERVER_URL}/api/pod/${id}` : `${SERVER_URL}/api/newpod`;
    const method = id ? "put" : "post";
    console.log("URL:", url);
    console.log("METHOD:", method);
    const obj: TensionPODData = {
      forceA: { type: "string", value: data.forceA },
      forceB: { type: "string", value: data.forceB },
      zupass_image_url: { type: "string", value: data.base64Image },
      source:{ type: "string", value: data.source ?? "" },
      zupass_title: { type: "string", value: `${data.forceA} vx. ${data.forceB}` },
      zupass_description: { type: "string", value: data.source ?? "" },
      zupass_display: { type: "string", value: "collectable" },
      owner: undefined,
      timestamp: undefined,
    };
    const response = await axios[method](
      url,
      {
        ...data,
        podEntries: JSON.stringify(obj),
        podFolder: "Tensions",
      } as TensionPODRequest,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Assuming the server returns the updated or new tension data
    const updatedTension: TensionPOD = response.data;
    onSuccess(updatedTension);
    return undefined; // No error, operation successful
  } catch (error: unknown) {
    console.error("Error adding/updating tension:", error);
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }
}

export async function handleDeleteTension(
  id: string | undefined,
  onSuccess: () => void
) {
  if (!id) return;
  try {
    await axios.delete(`${SERVER_URL}/api/pod/${id}`);
    onSuccess();
  } catch (error) {
    console.error("Error deleting tension:", error);
  }
}

export const truncateFileName = (fileName: string, maxLength: number = 12) => {
  if (fileName.length <= maxLength) return fileName;

  const extension = fileName.split(".").pop();
  const nameWithoutExtension = fileName.slice(0, fileName.lastIndexOf("."));

  if (nameWithoutExtension.length <= maxLength - 4) return fileName;

  const truncated =
    nameWithoutExtension.slice(0, maxLength - 5) +
    "..." +
    nameWithoutExtension.slice(-1);
  return `${truncated}.${extension}`;
};
