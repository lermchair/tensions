import { truncateFileName } from "@/lib/utils";
import { TensionPOD } from "@/types";
import React, { useState } from "react";

const CLIENT_URL = import.meta.env.PROD
  ? import.meta.env.VITE_CLIENT_URL
  : "http://localhost:5174";

export const TableRow: React.FC<{
  tension: TensionPOD;
  tension_id: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ tension, tension_id, onEdit, onDelete }) => {
  const [copied, setCopied] = useState<boolean>(false);
  return (
    <tr className="odd:bg-white even:bg-gray-50 border-b">
      <th
        scope="row"
        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
      >
        {tension.name}
      </th>
      <td className="px-6 py-4">{tension.source || "None"}</td>
      <td className="px-6 py-4">
        {tension.base64Image
          ? truncateFileName(tension.imageFileName)
          : "No image"}
      </td>
      <td className="px-6 py-4">
        <span
          className="font-medium text-blue-500 cursor-pointer"
          onClick={async () => {
            await navigator.clipboard.writeText(
              `${CLIENT_URL}?tension=${tension_id}`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied!" : "Copy Link"}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className="font-medium text-indigo-500 cursor-pointer"
          onClick={() => onEdit()}
        >
          Edit
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className="font-medium text-red-500 cursor-pointer"
          onClick={() => onDelete()}
        >
          Delete
        </span>
      </td>
    </tr>
  );
};
