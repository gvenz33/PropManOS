import { Suspense } from "react";
import { SubscriberSearch } from "./subscriber-search";

export function SubscriberSearchBar() {
  return (
    <Suspense fallback={null}>
      <SubscriberSearch />
    </Suspense>
  );
}
