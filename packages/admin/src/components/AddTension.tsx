import React, { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TensionData } from "@/types";

export const AddTension: React.FC<{
  initialTension: TensionData | undefined;
  onSubmit: (data: TensionData) => void;
}> = ({ initialTension, onSubmit }) => {
  const [tension, setTension] = useState<TensionData>(
    initialTension || {
      name: "",
      base64Image: "",
      source: "",
      imageFileName: "",
    }
  );
  const [error, setError] = useState<string | undefined>(undefined);

  const setTensionField = useCallback(
    (field: keyof TensionData, value: string) => {
      setTension((prevTension) => ({
        ...prevTension,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tension.name) {
      setError("Tension name is required");
      return;
    }
    onSubmit(tension);
    setTension({ name: "", base64Image: "", source: "", imageFileName: "" });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setTensionField("base64Image", e.target?.result as string);
        setTensionField("imageFileName", file.name);
      };
      reader.readAsDataURL(file);
    } else {
      return;
    }
  };

  return (
    <form
      className="w-full max-w-md border-2 rounded p-4"
      onSubmit={handleSubmit}
    >
      <span
        className={`font-semibold flex w-full ${!initialTension && "mb-4"}`}
      >
        {!initialTension && "Add Tension"}
      </span>
      <div className="flex flex-col items-center mb-6">
        <div className="w-full mb-2">
          <label
            className="block text-gray-500 text-left"
            htmlFor="tension-name"
          >
            Tension Name
          </label>
        </div>
        <div className="w-full">
          <input
            className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="tension-name"
            type="text"
            placeholder="Essentialism vs. Nominalism"
            value={tension.name}
            onChange={(e) => setTensionField("name", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="w-full mb-2">
          <label
            className="block text-gray-500 text-left"
            htmlFor="tension-source"
          >
            Source (optional)
          </label>
        </div>
        <div className="w-full">
          <input
            className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="tension-source"
            type="text"
            placeholder="Tension source"
            value={tension.source}
            onChange={(e) => setTensionField("source", e.target.value)}
          />
        </div>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label
          className="text-gray-500 text-md font-normal flex-start flex"
          htmlFor="picture"
        >
          Image
        </Label>
        {tension.base64Image && (
          <div className="py-2 flex items-center justify-center">
            <img
              src={tension.base64Image}
              alt={tension.imageFileName}
              className="max-w-full h-auto"
            />
          </div>
        )}
        <Input
          className="w-full mb-8"
          id="picture"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="w-full flex justify-end">
        <button
          className={`shadow bg-slate-800 hover:bg-slate-600 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded`}
          type="submit"
        >
          {initialTension ? "Save changes" : "Add tension"}
        </button>
      </div>
    </form>
  );
};
