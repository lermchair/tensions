import express from "express";
import dotenv from "dotenv";
import { POD } from "@pcd/pod";
import { SemaphoreSignaturePCDPackage } from "@pcd/semaphore-signature-pcd";
import cors from "cors";
import { PODMintRequest, TensionPOD, TensionPODRequest } from "./utils";
import { Redis } from "@upstash/redis";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SIGNER_KEY = process.env.SIGNER_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!SIGNER_KEY || !UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/pod/:id", async (req, res) => {
  try {
    const pod = await redis.get(req.params.id);
    if (!pod) {
      console.log(`Pod not found: ${req.params.id}`);
      return res.status(404).json({ message: "Pod not found" });
    }
    console.log(`Pod retrieved: ${req.params.id}`);
    res.json(pod);
  } catch (e) {
    console.error(`Error retrieving pod ${req.params.id}:`, e);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.delete("/api/pod/:id", async (req, res) => {
  try {
    const deleted = await redis.del(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Pod not found" });
    res.status(200).json({ message: "Successfully deleted pod" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.put("/api/pod/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as TensionPODRequest;
    if (!body?.podEntries)
      return res.status(400).json({ message: "Missing podEntries in request" });

    const existingPod = await redis.get(id);
    if (!existingPod)
      return res.status(404).json({ message: "Can't update nonexistent pod" });

    const podEntries = JSON.parse(body.podEntries);
    podEntries.timestamp = { type: "int", value: BigInt(Date.now()) };
    const pod = POD.sign(podEntries, SIGNER_KEY);

    const updatedPod = {
      ...body,
      serializedPOD: pod.serialize(),
    } as TensionPOD;
    await redis.set(id, JSON.stringify(updatedPod));
    res.status(200).json({ message: "Successful update" });
  } catch (e) {
    console.error(e);
    res
      .status(e instanceof SyntaxError ? 400 : 500)
      .json({ message: e instanceof Error ? e.message : "An error occurred" });
  }
});

app.post("/api/pod", async (req, res) => {
  try {
    const { semaphoreSignaturePCD, templateID } = req.body as PODMintRequest;
    if (!semaphoreSignaturePCD)
      throw new Error("Missing Semaphore Signature PCD in request");
    if (!templateID) throw new Error("Missing POD Template ID");

    const templatePODSerialized = await redis.get(templateID);
    if (!templatePODSerialized)
      throw new Error(`POD template ${templateID} doesn't exist`);

    const templatePOD = JSON.parse(
      templatePODSerialized as string
    ) as TensionPOD;
    const pcd = await SemaphoreSignaturePCDPackage.deserialize(
      semaphoreSignaturePCD.pcd
    );
    const owner = pcd.claim.identityCommitment;
    if (!(await SemaphoreSignaturePCDPackage.verify(pcd)))
      throw new Error("Couldn't verify Semaphore Signature PCD");

    const podEntries = JSON.parse(templatePOD.podEntries);
    podEntries.owner = { type: "cryptographic", value: BigInt(owner) };

    const newPOD = POD.sign(podEntries, SIGNER_KEY);
    const newPODID = newPOD.contentID.toString(16);
    const existingPOD = await redis.get(newPODID);
    if (existingPOD) throw new Error(`Already minted POD with ID: ${newPODID}`);

    const newPODData = {
      owner,
      podEntries: JSON.stringify(podEntries),
      serializedPOD: newPOD.serialize(),
    };
    await redis.set(newPODID, JSON.stringify(newPODData));

    res.status(200).json({ pod: newPOD.serialize() });
  } catch (e) {
    console.error(e);
    res
      .status(e instanceof SyntaxError ? 500 : 400)
      .json({ message: e instanceof Error ? e.message : "An error occurred" });
  }
});

app.get("/api/pods", async (req, res) => {
  try {
    let cursor = "0";
    const pods = [];
    const batchSize = 10;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        count: batchSize,
        match: "*",
      });
      cursor = nextCursor;

      if (keys.length > 0) {
        const values = await redis.mget(...keys);
        pods.push(...keys.map((key, index) => ({ key, value: values[index] })));
      }
    } while (cursor !== "0");

    res.status(200).json({ pods });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post("/api/newpod", async (req, res) => {
  try {
    const body = req.body as TensionPODRequest;
    if (!body?.podEntries) {
      console.log("Missing podEntries in request");
      throw new Error("Missing podEntries in request");
    }

    const podEntries = JSON.parse(body.podEntries);
    if (body.owner !== undefined) {
      podEntries.owner = { type: "cryptographic", value: body.owner };
    } else {
      delete podEntries.owner;
    }

    podEntries.timestamp = { type: "int", value: BigInt(Date.now()) };
    const pod = POD.sign(podEntries, SIGNER_KEY);

    const podCID = pod.contentID.toString(16);
    const newPODData = {
      ...body,
      serializedPOD: pod.serialize(),
    } as TensionPOD;
    await redis.set(podCID, JSON.stringify(newPODData));

    console.log(`New pod created with CID: ${podCID}`);
    res.status(200).json({ message: "Successfully added pod" });
  } catch (e) {
    console.error("Error creating new pod:", e);
    res.status(500).json({ message: "An error occurred" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `[${new Date().toISOString()}] Server is running on port ${PORT}`
  );
});
