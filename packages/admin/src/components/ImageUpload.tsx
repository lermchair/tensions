import { TensionData } from "@/types";
import React, { useState, ChangeEvent, useEffect } from "react";

export const ImageUpload: React.FC<{
  onUpload: (img: string, filename: string) => void;
  onDelete: () => void;
  onError: (err: string) => void;
  initialTension: TensionData | undefined;
}> = ({ initialTension, onUpload, onDelete, onError }) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const isImageFile = (file: File) => {
    return file.type.startsWith("image/");
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error("Error: ", error);
        reject("Failed to process the image. Please try again.");
      };
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      if (isImageFile(selectedFile)) {
        try {
          const base64Img = await convertToBase64(selectedFile);
          setPreviewUrl(base64Img);
          setFileName(selectedFile.name);
          onUpload(base64Img, selectedFile.name);
        } catch (error) {
          onError(error as string);
        }
      } else {
        onError("Please upload an image file.");
        setFileName(undefined);
        setPreviewUrl(undefined);
        event.target.value = "";
      }
    }
  };

  useEffect(() => {
    if (!initialTension || initialTension.base64Image.length == 0) return;
    setPreviewUrl(initialTension.base64Image as string);
    setFileName(initialTension.imageFileName);
  }, [initialTension]);

  return (
    <div className="flex items-center justify-center w-full mb-6">
      {previewUrl ? (
        <div className="flex flex-col items-center w-full">
          <img src={previewUrl} alt="Preview" className="max-h-48 mb-4" />
          <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded text-slate-600 w-full">
            {fileName && <span>{fileName}</span>}
            <div
              className=" text-red-400 p-1 rounded hover:bg-red-100 hover:text-red-500 cursor-pointer"
              onClick={() => {
                onDelete();
                setFileName(undefined);
                setPreviewUrl(undefined);
                onUpload("", "");
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, SVG
            </p>
            {fileName && (
              <p className="text-sm text-gray-500">File selected: {fileName}</p>
            )}
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
          />
        </label>
      )}
    </div>
  );
};
