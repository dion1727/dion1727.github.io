"use client";
import { Spotlight } from "@/components/ui/spotlight";
export default function SpotlightDemo(){
 return <div className="flex w-full items-center justify-center p-10">
  <Spotlight asChild className="w-80 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
   <div><h3 className="text-lg font-semibold">Move your cursor here</h3>
    <p className="mt-2 text-sm text-muted-foreground">The light follows your cursor and the nearest edge.</p>
   </div>
  </Spotlight>
 </div>;
}
