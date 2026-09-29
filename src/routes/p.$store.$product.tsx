import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/pavox/product-image";

export const Route = createFileRoute("/p/$store/$product")({ component: PublicProductPage });
function PublicProductPage() {
 const { store, product } = Route.useParams();
 const { data, isLoading } = useQuery({ queryKey:["public-product",store,product], queryFn: async()=>{ const {data:profile}=await supabase.from("profiles").select("id").eq("store_slug",store).maybeSingle(); if(!profile)return null; const {data:row}=await supabase.from("products").select("id,name,description,price,promotional_price,status,main_image,checkout_id,slug").eq("slug",product).eq("user_id",profile.id).maybeSingle(); return row??null; }});
 if(isLoading)return <main className="flex min-h-screen items-center justify-center bg-[#071426] text-white">Carregando produto...</main>;
 if(!data)return <main className="flex min-h-screen items-center justify-center bg-[#071426] px-6 text-center text-white"><div><Package className="mx-auto mb-4 size-10 text-primary"/><h1 className="text-2xl font-semibold">Produto não encontrado</h1></div></main>;
 const unavailable=data.status!=="Ativo"||!data.checkout_id;
 return <main className="min-h-screen bg-[#071426] px-4 py-12 text-white"><div className="mx-auto grid max-w-5xl gap-10 rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-10 md:grid-cols-2"><ProductImage path={data.main_image} alt={data.name} className="aspect-square w-full rounded-2xl" fallbackText={data.name.slice(0,2).toUpperCase()}/><div><p className="mb-3 text-sm font-medium uppercase tracking-[.2em] text-primary">PAVOX</p><h1 className="text-4xl font-semibold">{data.name}</h1>{data.description?<p className="mt-5 whitespace-pre-wrap text-white/65">{data.description}</p>:null}<p className="mt-8 text-3xl font-semibold text-primary">{brl(Number(data.promotional_price??data.price))}</p>{unavailable?<p className="mt-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">Este produto ainda não está disponível para compra.</p>:<Button className="mt-8 w-full" onClick={()=>{window.location.href=`/c/${store}/${data.checkout_id}`}}><ShoppingCart data-icon="inline-start"/>Comprar agora</Button>}</div></div></main>;
}
