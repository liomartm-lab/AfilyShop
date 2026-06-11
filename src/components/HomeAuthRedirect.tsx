"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, keepSessionInBrowser } from "@/lib/firebase";
import { getStoreByOwnerId } from "@/lib/stores";

export function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;

    keepSessionInBrowser();

    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const store = await getStoreByOwnerId(user.uid);
      router.replace(store?.setupComplete ? "/dashboard" : "/setup");
    });
  }, [router]);

  return null;
}
