import "./App.css";
import { TableRow } from "./components/TableRow";
import { AddTension } from "./components/AddTension";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TensionPOD } from "./types";
import { addOrUpdateTension, handleDeleteTension } from "./lib/utils";

function App() {
  const [tensions, setTensions] = useState<Map<string, TensionPOD>>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTension, setSelectedTension] = useState<string | undefined>();

  useEffect(() => {
    fetchTensions();
  }, []);

  const fetchTensions = async () => {
    try {
      const response = await axios.get("http://localhost:8788/api/pods");
      console.log(response);
      if (response.data.pods) {
        const pods = JSON.parse(response.data.pods);
        const deserialized = new Map<string, TensionPOD>();
        pods.forEach((p: { key: string; value: string }) => {
          deserialized.set(p.key, JSON.parse(p.value));
        });
        setTensions(deserialized);
      }
    } catch (error) {
      console.error("Error fetching tensions:", error);
    }
  };

  return (
    <div className="flex flex-col container items-center">
      <h1 className="text-xl font-semibold mb-4">Tension Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AddTension
          initialTension={undefined}
          onSubmit={(d) => addOrUpdateTension(d, () => fetchTensions())}
        />
        <div className="overflow-x-auto relative sm:rounded-lg md:col-span-2 w-full">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 ">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Tension
                </th>
                <th scope="col" className="px-6 py-3">
                  Source
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
              {tensions &&
                Array.from(tensions).map(([key, value]) => (
                  <TableRow
                    key={key}
                    tension_id={key}
                    tension={value}
                    onEdit={() => {
                      setSelectedTension(key);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTension(key, fetchTensions)}
                  />
                ))}
            </tbody>
          </table>
        </div>
        {selectedTension && (
          <Dialog open={isModalOpen} onOpenChange={() => setIsModalOpen(false)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Tension</DialogTitle>
              </DialogHeader>
              <AddTension
                initialTension={tensions?.get(selectedTension)}
                onSubmit={(t) => {
                  addOrUpdateTension(t, () => fetchTensions, selectedTension);
                  setIsModalOpen(false);
                  setSelectedTension(undefined);
                  fetchTensions();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default App;
