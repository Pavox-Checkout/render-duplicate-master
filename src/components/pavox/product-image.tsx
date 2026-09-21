import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { signedImageUrl } from "@/lib/products";

export function ProductImage({
  path,
  alt,
  className,
  fallbackText,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    setUrl("");
    if (path) {
      void signedImageUrl(path).then((u) => {
        if (active) setUrl(u);
      });
    }
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg bg-accent text-[12px] font-bold text-accent-foreground",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : fallbackText ? (
        fallbackText
      ) : (
        <ImageIcon className="h-4 w-4 opacity-60" />
      )}
    </span>
  );
}
