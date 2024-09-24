import { useEffect, useState } from "react";
import useQueryParams from "./lib/UseQueryParams";
import { useParcnetClient } from "./lib/UseParcnetClient";
import axios from "axios";
import { TensionPOD } from "./utils";
import { POD, PODEntries, podEntriesFromSimplifiedJSON } from "@pcd/pod";

function App() {
  const { z, connected } = useParcnetClient();
  const [tension, setTension] = useState<TensionPOD | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const queryParams = useQueryParams();

  useEffect(() => {
    fetchTension(queryParams);
  }, [queryParams]);

  const fetchTension = async (qp: Record<string, string>) => {
    if (!qp["tension"]) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/pod/${qp["tension"]}`
      );
      console.log(response);
      if (response.data) {
        const pod = response.data as TensionPOD;
        setTension(pod);
      }
    } catch (error) {
      console.error("Error fetching tensions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return !connected ? null : (
    <div className="container flex items-center justify-center mx-auto">
      {isLoading ? (
        <div className="border-2 w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : tension ? (
        <div className="w-full h-full">
          <span>{tension.name}</span>
          <img className="h-1/3 w-1/3" src={tension.base64Image} />
          <span>{tension.source}</span>
          <button
            className="rounded bg-emerald-600 text-white font-bold px-4 py-2 flex items-center justify-center cursor-pointer"
            onClick={async () => {
              const pubkey = await z.identity.getSemaphoreV3Commitment();
              console.log(pubkey);
              const deserializedPOD = POD.deserialize(tension.serializedPOD);
              console.log(deserializedPOD);
              const v = deserializedPOD.verifySignature();
              console.log(v);
              const data = deserializedPOD.content.asEntries();
              data["zupass_image_url"] = {
                type: "string",
                value: tension.base64Image,
              };
              data["zupass_display"] = {
                type: "string",
                value: "collectable",
              };
              data["zupass_title"] = {
                type: "string",
                value: tension.name,
              };
              data["owner"] = {
                type: "cryptographic",
                value: pubkey,
              };
              console.log(data);

              const pod = await z.pod.sign(data);
              console.log(pod);
              await z.pod.insert(pod);
            }}
          >
            Get it
          </button>
        </div>
      ) : (
        <div className="text-center text-xl font-semibold">
          No tension found
        </div>
      )}
    </div>
  );
}

export default App;
