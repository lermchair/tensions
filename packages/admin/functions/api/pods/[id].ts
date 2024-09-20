import { POD } from "@pcd/pod";
import { TensionPODRequest } from "utils";

interface Env {
  tensions_dev: KVNamespace;
  SIGNER_KEY: string;
}

export const onRequestDelete: PagesFunction<Env, string> = async (ctx) => {
  const pod_cid = Array.isArray(ctx.params.id)
    ? ctx.params.id[0]
    : ctx.params.id;
  try {
    await ctx.env.tensions_dev.delete(pod_cid);
    return new Response("Successful delete", {
      status: 200,
    });
  } catch (e) {
    return Response.json({ name: e.name, message: e.message }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env, string> = async (ctx) => {
  try {
    const id = Array.isArray(ctx.params.id) ? ctx.params.id[0] : ctx.params.id;
    console.log("Editing id: ", id);
    const body = (await ctx.request.json()) as TensionPODRequest;
    if (!body?.podEntries)
      return Response.json("Missing podEntries in request", { status: 500 });
    if (!ctx.env.tensions_dev.get(id))
      throw new Error("Can't update nonexistent pod");
    await ctx.env.tensions_dev.delete(id);
    const podEntries = JSON.parse(body.podEntries);
    podEntries.timestamp = { type: "int", value: BigInt(Date.now()) };
    const pod = POD.sign(podEntries, ctx.env.SIGNER_KEY);
    const serializedPOD = pod.serialize();
    await ctx.env.tensions_dev.put(
      id,
      JSON.stringify({
        ...body,
        serializedPOD,
      })
    );
    return Response.json({ message: "Successful update" }, { status: 200 });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return Response.json({ message: e.message }, { status: 500 });
    }
  }
};
