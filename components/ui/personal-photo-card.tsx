"use client";
import { Spotlight } from "@/components/ui/spotlight";
import Image from "next/image"; // For a Next.js + shadcn application; replace with <img> for Vite.
type PersonalPhotoCardProps={src:string;alt:string;caption:string};
export default function PersonalPhotoCard({src,alt,caption}:PersonalPhotoCardProps){
 return <Spotlight asChild color="#d9cbff" size={320}
  className="group relative isolate overflow-hidden rounded-3xl border border-white/20 bg-zinc-900 shadow-xl">
  <div className="aspect-[4/5]">
   <Image src={src} alt={alt} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
   <span className="absolute inset-x-4 bottom-4 rounded-xl border border-white/20 bg-black/50 p-4 text-white backdrop-blur-xl">{caption}</span>
  </div>
 </Spotlight>;
}
