import { readFile } from "node:fs/promises";
import path from "node:path";
import { authenticatedOwner } from "@/lib/business-world/http";
export async function GET(){
  try{await authenticatedOwner();}catch{return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>登录工作区</title><h1>请先登录工作区</h1><p>经营记录仅对当前账户开放。</p><a href="/business-world/sign-in">前往登录</a></html>',{status:401,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store"}});}
  const source=await readFile(path.join(process.cwd(),"public/business-world/ui.html"),"utf8");
  const html=source.replace('<head>','<head><meta name="business-world-state" content="/api/business-world/workspace">').replaceAll('src="./src/','src="/business-world/src/');
  return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
}
