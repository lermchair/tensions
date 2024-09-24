import { POD } from "@pcd/pod";
import { PODMintRequest, TensionPOD } from "utils";
import { GPCPCD, GPCPCDPackage } from "@pcd/gpc-pcd";

interface Env {
  tensions_dev: KVNamespace;
  SIGNER_KEY: string;
}

export const onRequestGet: PagesFunction<Env, string> = async (ctx) => {
  try {
    const id = Array.isArray(ctx.params.id) ? ctx.params.id[0] : ctx.params.id;
    const pod = await ctx.env.tensions_dev.get(id);
    if (!pod) {
      return Response.json({ message: "Pod not found" }, { status: 404 });
    }
    return Response.json(pod);
  } catch (e) {
    return Response.json({ name: e.name, message: e.message }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env, string> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as PODMintRequest;
    if (!body?.owner) throw new Error("Missing owner pcd in request");
    if (!body?.templateID) throw new Error("Missing POD Template ID");
    const templatePODSerialized = await ctx.env.tensions_dev.get(
      body.templateID
    );
    if (!templatePODSerialized)
      throw new Error(`POD template ${body.templateID} doesn't exist`);

    const templatePOD = JSON.parse(templatePODSerialized) as TensionPOD;

    // const currentTime = BigInt(Date.now());
    // const timestampString = pcd.claim.revealed.owner?.externalNullifier?.value;
    // const nullifierHash = pcd.claim.revealed.owner?.nullifierHash;
    await GPCPCDPackage.verify(body.owner);
    // if (!nullifierHash) {
    // return [0n, false];
    // return [
    //   pcd.claim.revealed.pods.pod0?.entries.owner?.value ?? 0n,
    //   pcd.claim.config.pods.pod0.entries.owner.isRevealed &&
    //     pcd.claim.config.pods.pod0.entries.owner.isOwnerID &&
    //     timestampString &&
    //     currentTime - BigInt(timestampString) < TIMESTAMP_EXPIRY_TIME &&
    //     (await GPCPCDPackage.verify(pcd)),
    // ];

    const podEntries = JSON.parse(templatePOD.podEntries);

    podEntries["owner"] = {
      type: "cryptographic",
      value: BigInt(body.owner),
    };

    const newPOD = POD.sign(JSON.parse(podEntries), ctx.env.SIGNER_KEY);

    const newPODID = newPOD.contentID.toString(16);
    const alreadyMinted = await ctx.env.tensions_dev.get(newPODID);
    if (alreadyMinted)
      throw new Error(`Already minted POD with ID: ${newPODID}`);
    await ctx.env.tensions_dev.put(newPODID, body.owner);
    const serialized = newPOD.serialize();
    return Response.json(
      {
        pod: serialized,
      },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof SyntaxError) {
      return Response.json({ message: e.message }, { status: 500 });
    }
  }
};
