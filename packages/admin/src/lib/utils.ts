import { TensionData, TensionPODData, TensionPODRequest } from "@/types";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function addOrUpdateTension(
  data: TensionData,
  onSuccess: () => void,
  id?: string
) {
  try {
    const url = id
      ? `http://localhost:8788/api/pods/${id}`
      : `http://localhost:8788/api/pods`;
    const method = id ? "put" : "post";
    console.log("URL:", url);
    console.log("METHOD:", method);
    await axios[method](
      url,
      {
        ...data,
        podEntries: JSON.stringify({
          name: { type: "string", value: data.name },
          base64Image: { type: "string", value: data.base64Image },
          source: { type: "string", value: data.source },
        } as TensionPODData),
        podFolder: "Tensions",
      } as TensionPODRequest,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    onSuccess();
  } catch (error) {
    console.error("Error adding/updating tension:", error);
  }
}

export async function handleDeleteTension(
  id: string | undefined,
  onSuccess: () => void
) {
  if (!id) return;
  try {
    await axios.delete(`http://localhost:8788/api/pods/${id}`);
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
