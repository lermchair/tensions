import { useEffect, useState } from "react";
import useQueryParams from "./lib/UseQueryParams";
import { useParcnetClient } from "./lib/UseParcnetClient";
import axios from "axios";
import { TensionPOD } from "./utils";
import { POD, PODEntries } from "@pcd/pod";

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
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : tension ? (
        <div className="flex flex-col items-center justify-center">
          <span className="my-2 text-3xl">{tension.name}</span>
          <img src={tension.base64Image} />
          {tension.source && <span>{tension.source}</span>}
          <button
            className="mt-2 rounded bg-emerald-600 text-white font-bold px-4 py-2 flex items-center justify-center cursor-pointer"
            onClick={async () => {
              const pubkey = await z.identity.getSemaphoreV4Commitment();
              console.log(pubkey);
              const deserializedPOD = POD.deserialize(tension.serializedPOD);
              console.log(deserializedPOD);
              const validSignedPod = deserializedPOD.verifySignature();
              console.log(validSignedPod);
              if (!validSignedPod) {
                console.error("Invalid signature for pod");
                return;
              }
              const idPod = {
                pubkey: { type: "cryptographic", value: pubkey },
                templateId: { type: "string", value: queryParams["tension"] },
              } as PODEntries;
              const idPodSigned = await z.pod.sign(idPod);
              const resp = await axios.post(`http://localhost:3000/api/pod`, {
                pod: idPodSigned.serialize(),
              });
              // console.log(resp);
              // console.log(data);

              // const pod = await z.pod.sign(data);
              // console.log(pod);
              if (resp.data.pod) {
                console.log("inserting pod...");
                const deserialized = POD.deserialize(resp.data.pod);
                await z.pod.insert(deserialized);
              }
            }}
          >
            Collect Tension
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
