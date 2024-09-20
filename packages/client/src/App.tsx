import { useState } from "react";
import useQueryParams from "./lib/UseQueryParams";
import { useParcnetClient } from "./lib/UseParcnetClient";

function App() {
  const { z, connected } = useParcnetClient();
  const [publicKey, setPublicKey] = useState<string | undefined>(undefined);

  const queryParams = useQueryParams();

  return !connected ? null : (
    <>
      <span>Collect a pod</span>
      <button>Collect</button>
      <button
        onClick={async () => {
          try {
            const pub = await z.identity.getPublicKey();
            setPublicKey(pub);
          } catch (e) {
            console.log(e);
          }
        }}
      >
        Get id
      </button>
      <span>{publicKey?.toString()}</span>
      <div>
        <h1>Query Parameters:</h1>
        <pre>{JSON.stringify(queryParams, null, 2)}</pre>
      </div>
    </>
  );
}

export default App;
