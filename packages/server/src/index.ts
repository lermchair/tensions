import express from "express";
import dotenv from "dotenv";
import { kv } from "@vercel/kv";
import { POD } from "@pcd/pod";
import { SemaphoreSignaturePCDPackage } from "@pcd/semaphore-signature-pcd";
import cors from "cors";
import { PODMintRequest, TensionPOD, TensionPODRequest } from "./utils";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const SIGNER_KEY = process.env.SIGNER_KEY;

// GET endpoint
app.get("/api/pod/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const pod = await kv.get(id);
    if (!pod) {
      return res.status(404).json({ message: "Pod not found" });
    }
    return res.json(pod);
  } catch (e: Error | unknown) {
    console.error(e);
    return res.status(500).json(e);
  }
});

// POST endpoint for POD minting
app.post("/api/pod", async (req, res) => {
  try {
    const body = req.body as PODMintRequest;
    if (!body?.semaphoreSignaturePCD)
      throw new Error("Missing Semaphore Signature PCD in request");
    if (!body?.templateID) throw new Error("Missing POD Template ID");
    const templatePODSerialized = await kv.get(body.templateID);
    if (!templatePODSerialized)
      throw new Error(`POD template ${body.templateID} doesn't exist`);

    const templatePOD = JSON.parse(
      templatePODSerialized as string
    ) as TensionPOD;
    const pcdSerialized = body.semaphoreSignaturePCD.pcd;
    const pcd = await SemaphoreSignaturePCDPackage.deserialize(pcdSerialized);
    console.log("Deserialized pcd:", pcd);
    const owner = pcd.claim.identityCommitment;
    const valid = await SemaphoreSignaturePCDPackage.verify(pcd);
    if (!valid) throw new Error("Couldn't verify Semaphore Signature PCD");

    const podEntries = JSON.parse(templatePOD.podEntries);

    podEntries["owner"] = {
      type: "cryptographic",
      value: BigInt(owner),
    };

    const newPOD = POD.sign(JSON.parse(podEntries), process.env.SIGNER_KEY!);

    const newPODID = newPOD.contentID.toString(16);
    const alreadyMinted = await kv.get(newPODID);
    if (alreadyMinted)
      throw new Error(`Already minted POD with ID: ${newPODID}`);
    await kv.set(newPODID, owner);
    const serialized = newPOD.serialize();
    return res.status(200).json({ pod: serialized });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return res.status(500).json({ message: e.message });
    }
    console.error(e);
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET endpoint for all PODs
app.get("/api/pods", async (req, res) => {
  try {
    let pods = [];
    for await (const key of kv.scanIterator()) {
      const value = await kv.get(key);
      pods.push({ key, value });
    }
    return res.status(200).json({ pods: JSON.stringify(pods) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred" });
  }
});

// POST endpoint for creating a new POD
app.post("/api/newpod", async (req, res) => {
  try {
    const body = req.body as TensionPODRequest;
    if (!body?.podEntries) throw new Error("Missing podEntries in request");
    const podEntries = JSON.parse(body.podEntries);
    if (body.owner !== undefined) {
      podEntries["owner"] = {
        type: "cryptographic",
        value: body.owner,
      };
    } else {
      if (podEntries.owner) delete podEntries.owner;
    }

    podEntries.timestamp = { type: "int", value: BigInt(Date.now()) };
    const pod = POD.sign(podEntries, process.env.SIGNER_KEY!);

    if (body.owner === undefined) {
      const podCID = pod.contentID.toString(16);
      console.log("POD CID: ", podCID);
      const serializedPOD = pod.serialize();
      await kv.set(
        podCID,
        JSON.stringify({
          serializedPOD,
          ...body,
        } as TensionPOD)
      );
      return res.status(200).json({ message: "Successfully added pod" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json(e);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
