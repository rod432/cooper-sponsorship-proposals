import { Suspense } from "react";
import CreateProposalView from "./create-proposal-view";

export default function CreateProposalPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <CreateProposalView />
    </Suspense>
  );
}
