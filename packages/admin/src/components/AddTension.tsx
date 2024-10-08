import React, { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TensionData } from "@tensions/common";
import { isValidUrl } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"



export const AddTension: React.FC<{
  initialTension: TensionData | undefined;
  onSubmit: (data: TensionData) => Promise<string | undefined>;
}> = ({ initialTension, onSubmit }) => {
  const [tension, setTension] = useState<TensionData>(
    initialTension || {
      forceA: "",
      forceB: "",
      base64Image: "",
      author: "",
      tradeoff: 3,
      ideaSource: "",
      imageFileName: "",
      lighthouse: "d/acc",
      details: "",
    }
  );
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setTensionField = useCallback(
    (field: keyof TensionData, value: string | number) => {
      setTension((prevTension) => ({
        ...prevTension,
        [field]: value,
      }));
      setError(undefined); // Clear error when user updates a field
    },
    []
  );

  const isSubmitDisabled =
      !tension.forceA.trim() ||
      !tension.forceB.trim() ||
      !tension.base64Image.trim() ||
      (tension.ideaSource && !isValidUrl(tension.ideaSource)) ||
      !tension.author||
      !tension.ideaSource ||
      isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) {
      if (tension.ideaSource && !isValidUrl(tension.ideaSource)) {
         setError("Please enter a valid URL for the idea source");
       } else {
         setError("Tension name and image are required");
       }
       return;
    }
    setIsSubmitting(true);
    try {
      const result = await onSubmit(tension);
      if (typeof result === "string") {
        setError(result);
      } else {
        setTension({
          forceA: "",
          forceB: "",
          base64Image: "",
          author: "",
          tradeoff: 3,
          ideaSource: "",
          imageFileName: "",
          lighthouse: "d/acc",
          details: "",
        });
        setError(undefined);
      }
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="flex flex-row items-center mb-6 gap-4">
      <div className="flex flex-col">
          <label
            className="block text-gray-500 text-left"
            htmlFor="tension-name"
          >
            Force A
          </label>
        <div className="w-full">
          <input
            className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="tension-name"
            type="text"
            placeholder="Essentialism"
            value={tension.forceA}
            onChange={(e) => setTensionField("forceA", e.target.value)}
          />
        </div>
      </div>

        <div className="flex flex-col">
            <label
              className="block text-gray-500 text-left"
              htmlFor="tension-name"
            >
              Force B
            </label>
          <div className="w-full">
            <input
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="tension-name"
              type="text"
              placeholder="Nominalism"
              value={tension.forceB}
              onChange={(e) => setTensionField("forceB", e.target.value)}
            />
          </div>
          </div>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="w-full mb-2">
          <label
            className="block text-gray-500 text-left"
            htmlFor="tension-author"
          >
            Card Author
          </label>
        </div>
        <div className="w-full">
          <input
            className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="tension-author"
            type="text"
            placeholder="A name"
            value={tension.author}
            onChange={(e) => setTensionField("author", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="w-full mb-2">
          <label
            className="block text-gray-500 text-left"
            htmlFor="tension-source"
          >
            Idea Source URL
          </label>
        </div>
        <div className="w-full">
          <input
            className={`appearance-none border-2 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500 ${
               tension.ideaSource && !isValidUrl(tension.ideaSource)
                 ? "border-red-500"
                 : "border-gray-200"
             }`}
            id="tension-source"
            type="text"
            placeholder="https://example.com/ideas/example-i-and-example-ii"
            value={tension.ideaSource}
            onChange={(e) => setTensionField("ideaSource", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col mb-6 gap-4">
        <label className="block text-gray-500 text-left" htmlFor="tension-tradeoff">
          Editorial Opinion Tradeoff
        </label>
        <Slider id="tension-tradeoff" defaultValue={[3]} max={5} step={1}  onValueChange={(value) => setTensionField("tradeoff", value[0])} />
        <div className="w-full h-full flex items-center justify-between">
        {tension.forceA ? (
          <span className="text-gray-500">{tension.forceA}</span>
        ) : (
          <span className="text-gray-500">Left</span>
        )}
        {tension.forceB ? (
          <span className="text-gray-500">{tension.forceB}</span>
        ) : (
          <span className="text-gray-500">Right</span>
        )}
        </div>
      </div>

      <div className="mb-4">
      <Label
        className="text-gray-500 text-md font-normal flex-start flex mb-2"
        htmlFor="details"
      >
        Lighthouse
      </Label>
      <Select onValueChange={(value) => setTensionField("lighthouse", value)} defaultValue={"hardened commons"}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Lighthouse" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hardened commons">Hardened commons</SelectItem>
          <SelectItem value="protocol literacy">Protocol literacy</SelectItem>
          <SelectItem value="d/acc">d/acc</SelectItem>
          <SelectItem value="punk spirit">Punk spirit</SelectItem>
        </SelectContent>
      </Select>
      </div>

      <Label
        className="text-gray-500 text-md font-normal flex-start flex mb-2"
        htmlFor="details"
      >
        Details
      </Label>
      <Textarea id="details" className="mb-4" value={tension.details} onChange={(e) => setTensionField("details", e.target.value)} />

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
          className={`shadow bg-slate-800 hover:bg-slate-600 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded ${
            isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          type="submit"
          disabled={isSubmitDisabled}
        >
          {isSubmitting
            ? "Submitting..."
            : initialTension
            ? "Save changes"
            : "Add tension"}
        </button>
      </div>
    </form>
  );
};
