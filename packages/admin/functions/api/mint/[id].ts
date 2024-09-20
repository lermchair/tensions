import { POD } from "@pcd/pod";
import { SemaphoreSignaturePCDPackage } from "@pcd/semaphore-signature-pcd";
import { PODMintRequest, TensionPOD } from "utils";

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
    if (!body?.semaphoreSignaturePCD)
      throw new Error("Missing Semaphore Signature PCD in request");
    if (!body?.templateID) throw new Error("Missing POD Template ID");
    const templatePODSerialized = await ctx.env.tensions_dev.get(
      body.templateID
    );
    if (!templatePODSerialized)
      throw new Error(`POD template ${body.templateID} doesn't exist`);

    const templatePOD = JSON.parse(templatePODSerialized) as TensionPOD;
    const pcdSerialized = body.semaphoreSignaturePCD.pcd;
    // const pcd = await SemaphoreSignaturePCDPackage.deserialize(pcdSerialized);

    // console.log("Deserialized pcd:", pcd);
    // const owner = pcd.claim.identityCommitment;
    // const valid = await SemaphoreSignaturePCDPackage.verify(pcd);
    // if (!valid) throw new Error("Couldn't verify Semaphore Signature PCD");

    // const podEntries = JSON.parse(templatePOD.podEntries);

    // podEntries["owner"] = {
    //   type: "cryptographic",
    //   value: BigInt(owner),
    // };

    // const newPOD = POD.sign(JSON.parse(podEntries), ctx.env.SIGNER_KEY);

    // const newPODID = newPOD.contentID.toString(16);
    // const alreadyMinted = await ctx.env.tensions_dev.get(newPODID);
    // if (alreadyMinted)
    //   throw new Error(`Already minted POD with ID: ${newPODID}`);
    // await ctx.env.tensions_dev.put(newPODID, owner);
    // const serialized = newPOD.serialize();
    // return Response.json(
    //   {
    //     pod: serialized,
    //   },
    //   { status: 200 }
    // );
  } catch (e) {
    if (e instanceof SyntaxError) {
      return Response.json({ message: e.message }, { status: 500 });
    }
  }
};
