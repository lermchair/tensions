import { POD } from "@pcd/pod";
import { TensionPOD, TensionPODRequest } from "utils";

interface Env {
  tensions_dev: KVNamespace;
  SIGNER_KEY: string;
}

export const onRequestGet: PagesFunction<Env, undefined> = async (ctx) => {
  let pods = [];
  let cursor: string | undefined;
  do {
    const result = await ctx.env.tensions_dev.list({ cursor, limit: 1000 });
    cursor = result.cursor;

    const batch = await Promise.all(
      result.keys.map(async ({ name }) => ({
        key: name,
        value: await ctx.env.tensions_dev.get(name),
      }))
    );

    pods = pods.concat(batch);
  } while (cursor);

  return Response.json({ pods: JSON.stringify(pods) }, { status: 200 });
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as TensionPODRequest;
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
    const pod = POD.sign(podEntries, ctx.env.SIGNER_KEY);

    if (body.owner === undefined) {
      const podCID = pod.contentID.toString(16);
      console.log("POD CID: ", podCID);
      const serializedPOD = pod.serialize();
      await ctx.env.tensions_dev.put(
        podCID,
        JSON.stringify({
          serializedPOD,
          ...body,
        } as TensionPOD)
      );
      return Response.json("Successfully added pod", { status: 200 });
    }
  } catch (e) {
    console.error(e);
    return Response.json(e, { status: 500 });
  }
};
