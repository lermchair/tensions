import "./App.css";
import { TableRow } from "./components/TableRow";
import { AddTension } from "./components/AddTension";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TensionData, TensionPOD } from "@tensions/common";
import { addOrUpdateTension, handleDeleteTension } from "./lib/utils";

const SERVER_URL = import.meta.env.PROD
  ? import.meta.env.VITE_SERVER_URL
  : "http://localhost:3000";

function App() {
  const [tensions, setTensions] = useState<Map<string, TensionPOD>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [selectedTension, setSelectedTension] = useState<string | undefined>();

  const fetchTensions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${SERVER_URL}/api/pods`);
      if (response.data) {
        const pods = response.data.pods;
        const deserialized = new Map<string, TensionPOD>();
        pods.forEach((p: { key: string; value: TensionPOD }) => {
          deserialized.set(p.key, p.value);
        });
        console.log(deserialized);
        setTensions(deserialized);
      }
    } catch (error) {
      console.error("Error fetching tensions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTensions();
  }, [fetchTensions]);

  const handleAddTension = useCallback(
    async (d: TensionData): Promise<string | undefined> => {
      try {
        return await addOrUpdateTension(d, fetchTensions);
      } catch (error: unknown) {
        if (error instanceof Error) {
          return error.message;
        }
        return "An error occurred while adding the tension";
      }
    },
    [fetchTensions]
  );

  const handleEditTension = useCallback(
    async (t: TensionData, id: string): Promise<string | undefined> => {
      try {
        const result = await addOrUpdateTension(t, fetchTensions, id);
        if (!result) {
          setIsModalOpen(false);
          setSelectedTension(undefined);
        }
        return result;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return error.message;
        }
        return "An error occurred while editing the tension";
      }
    },
    [fetchTensions]
  );

  const handleDeleteTensionWrapper = useCallback(
    async (id: string) => {
      await handleDeleteTension(id, fetchTensions);
    },
    [fetchTensions]
  );

  const sortedTensions = Array.from(tensions.entries()).sort((a, b) => {
    const timestampA = a[1].serializedPOD
      ? JSON.parse(a[1].serializedPOD).entries.timestamp?.value ?? 0
      : 0;
    const timestampB = b[1].serializedPOD
      ? JSON.parse(b[1].serializedPOD).entries.timestamp?.value ?? 0
      : 0;
    return Number(timestampB) - Number(timestampA);
  });

  return (
    <div className="flex flex-col container items-center">
      <h1 className="text-xl font-semibold mb-4">Tension Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AddTension initialTension={undefined} onSubmit={handleAddTension} />
        <div className="overflow-x-auto relative sm:rounded-lg md:col-span-2 w-full">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 ">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Tension
                </th>
                <th scope="col" className="px-6 py-3">
                  Author
                </th>
                <th scope="col" className="px-6 py-3">
                  Image
                </th>
                <th scope="col" className="px-6 py-3">
                  Link
                </th>
                <th scope="col" className="px-6 py-3"></th>
                <th scope="col" className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded-sm w-3/4"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded-sm w-1/2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-10 bg-gray-200 rounded-sm"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-8 bg-gray-200 rounded-sm"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-8 bg-gray-200 rounded-sm"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-8 bg-gray-200 rounded-sm"></div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                sortedTensions.map(([key, value]) => (
                  <TableRow
                    key={key}
                    tension_id={key}
                    tension={value}
                    onEdit={() => {
                      setSelectedTension(key);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTensionWrapper(key)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {selectedTension && (
          <Dialog open={isModalOpen} onOpenChange={() => setIsModalOpen(false)}>
            <DialogContent className="sm:max-w-[425px] overflow-y-scroll max-h-screen">
              <DialogHeader>
                <DialogTitle>Edit Tension</DialogTitle>
              </DialogHeader>
              <AddTension
                initialTension={tensions.get(selectedTension)}
                onSubmit={(t) => handleEditTension(t, selectedTension)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default App;
