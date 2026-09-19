import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";
import { betterAuthEveAuth, passwordEveAuth } from "@/lib/eve-auth";

const previewBrowserAuth =
  process.env.VERCEL_ENV === "preview" ? [none()] : [];

export default eveChannel({
  auth: [
    betterAuthEveAuth,
    passwordEveAuth,
    vercelOidc(),
    localDev(),
    ...previewBrowserAuth,
  ],
  uploadPolicy: "disabled",
});
