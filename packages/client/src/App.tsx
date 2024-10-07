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
  const [collected, setCollected] = useState(false);
  const [collectingMessage, setCollectingMessage] = useState("");

  const SERVER_URL = import.meta.env.PROD
    ? import.meta.env.VITE_SERVER_URL
    : "http://localhost:3000";

  const queryParams = useQueryParams();

  useEffect(() => {
    fetchTension(queryParams);
  }, [queryParams]);

  const fetchTension = async (qp: Record<string, string>) => {
    setIsLoading(true);
    setCollected(false);
    setCollectingMessage("");

    if (!qp["tension"]) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${SERVER_URL}/api/pod/${qp["tension"]}`
      );
      console.log(response);
      if (response.data) {
        const pod = JSON.parse(response.data) as TensionPOD;
        setTension(pod);
      }
    } catch (error) {
      console.error("Error fetching tensions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectTension = async () => {
    if (!tension) return;

    setCollectingMessage("Collecting tension...");
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out")), 5000)
      );

      const collectPromise = (async () => {
        setCollectingMessage("Getting Semaphore commitment...");
        const pubkey = await z.identity.getSemaphoreV4Commitment();
        console.log(await z.identity.getSemaphoreV4Commitment());

        setCollectingMessage("Deserializing pod...");
        const deserializedPOD = POD.deserialize(tension.serializedPOD);

        setCollectingMessage("Verifying signature...");
        const validSignedPod = deserializedPOD.verifySignature();
        if (!validSignedPod) {
          throw new Error("Invalid signature for pod");
        }

        const idPod = {
          pubkey: { type: "cryptographic", value: pubkey },
          templateId: { type: "string", value: queryParams["tension"] },
        } as PODEntries;

        setCollectingMessage("Signing pod...");
        const idPodSigned = await z.pod.sign(idPod);

        const resp = await axios.post(`${SERVER_URL}/api/pod`, {
          pod: idPodSigned.serialize(),
        });

        if (resp.data.pod) {
          const deserialized = POD.deserialize(resp.data.pod);
          await z.pod.insert(deserialized);
          setCollected(true);
          setCollectingMessage("Collected successfully!");
        } else {
          throw new Error("Failed to collect tension");
        }
      })();
      await Promise.race([collectPromise, timeoutPromise]);
    } catch (error) {
      console.error("Error collecting tension:", error);
      if (error instanceof Error) {
        setCollectingMessage(`Error: ${error.message}. Please try again.`);
      } else {
        setCollectingMessage("Error collecting tension. Please try again.");
      }
    }
  };

  if (!connected) return null;

  return (
    <div className="container flex items-center justify-center mx-auto min-h-screen bg-gray-50">
      {isLoading ? (
        <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ) : tension ? (
        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md">
            <span className="my-2 text-3xl font-bold">{tension.forceA} vs. {tension.forceB}</span>
          <img
            src={tension.base64Image}
            className="max-w-md rounded-lg"
            alt="Tension"
          />
          {tension.source && (
            <span className="mt-2 text-gray-600">{tension.source}</span>
          )}
          <button
            className={`mt-4 rounded ${
              collected
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            } text-white font-bold px-4 py-2 flex items-center justify-center transition-colors`}
            onClick={handleCollectTension}
            disabled={collected}
          >
            {collected ? "Tension Collected" : "Collect Tension"}
          </button>
          {collectingMessage && (
            <p
              className={`mt-2 text-sm ${
                collected ? "text-green-600" : "text-blue-600"
              }`}
            >
              {collectingMessage}
            </p>
          )}
          {collected && (
            <a href="https://develop.zupass.org/#/?folder=PODs%2520from%2520Zapps">
              <div
                className={`mt-4 rounded ${"bg-emerald-600 hover:bg-emerald-700"} text-white font-bold px-4 py-2 flex items-center justify-center transition-colors`}
              >
                View in Zupass
              </div>
            </a>
          )}
        </div>
      ) : (
        <div className="text-center text-xl font-semibold bg-white p-4 rounded-lg shadow-md">
          No tension found
        </div>
      )}
    </div>
  );
}

export default App;
