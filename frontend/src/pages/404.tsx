import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return null; // or you can return a loading spinner here
}
