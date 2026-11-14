import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const readParts = (dir) => readdirSync(dir).filter(x => x.endsWith(".b64")).sort().map(x => readFileSync(join(dir,x),"utf8").trim()).join("");
const htmlGzip = Buffer.from(readParts("transfer/index-html-gzip"),"base64");
const html = gunzipSync(htmlGzip);
const htmlSha1 = createHash("sha1").update(html).digest("hex");
if (htmlSha1 !== "b86cde8e90d835418245f51f43238078ecb49812") throw new Error("Main HTML SHA-1 mismatch: "+htmlSha1);
writeFileSync("index.html",html);
const archive = Buffer.from(readParts("transfer/engines-tar-gzip"),"base64");
const archiveSha = createHash("sha256").update(archive).digest("hex");
if (archiveSha !== "91a3fbbae1376a351d7e3f8b726d86cc40d41a7a7db885d341c391c34a62cf9d") throw new Error("Engine archive SHA-256 mismatch: "+archiveSha);
writeFileSync("/tmp/studio-engines.tar.gz",archive);
execFileSync("tar",["-xzf","/tmp/studio-engines.tar.gz","-C","."]);
rmSync("transfer",{recursive:true,force:true});
console.log("Reconstructed index.html ("+html.length+" bytes) and extracted engine, asset, documentation, and QA files.");
