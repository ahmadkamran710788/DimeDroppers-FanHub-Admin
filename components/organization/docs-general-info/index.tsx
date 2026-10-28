"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import Tabs from "@/components/common/tabs";
import AddDocumentModal from "@/components/organization/docs-general-info/add-document-modal";
import DocumentCard from "@/components/organization/docs-general-info/document-card";
import ViewDocumentModal from "@/components/organization/docs-general-info/view-document-modal";
import { SAMPLE_DOCUMENTS, TABS, type DocsTab, type EventDocument } from "@/components/organization/docs-general-info/data";
import { orgKindOf, useAuth } from "@/context/auth";
import { routes } from "@/utils/routes";

// Docs & General Info (tournament only): the event documents fans see in the Fan Hub app. A document
// opens in a popup; "Add Document" adds a PDF. Sample data, and added documents last only until the
// page is left. General Info is coming soon.
export default function DocsGeneralInfoPage() {
  const router = useRouter();
  const { org } = useAuth();
  const orgKind = orgKindOf(org);
  const [tab, setTab] = useState<DocsTab>("Documents");
  const [documents, setDocuments] = useState<EventDocument[]>(SAMPLE_DOCUMENTS);
  const [opened, setOpened] = useState<EventDocument | null>(null);
  const [adding, setAdding] = useState(false);

  // A school opening the URL goes back to its Command Center.
  useEffect(() => {
    if (orgKind === "school") router.replace(routes.ui.commandCenter);
  }, [orgKind, router]);

  // Added PDFs are object URLs; free them when the page goes.
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  if (orgKind === "school") return null;

  const addDocument = (name: string, file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setDocuments((prev) => [{ id: crypto.randomUUID(), name, uploadedAt: new Date().toISOString(), url }, ...prev]);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Docs &amp; General Info
          </h2>
          <p className="text-base leading-[26px]">Documents and general info fans and teams see in the app.</p>
        </div>
        <Button
          variant="cta"
          label="Add Document"
          icon={<Plus className="size-5" />}
          className="shrink-0 whitespace-nowrap"
          onClick={() => setAdding(true)}
        />
      </div>

      <div className="rounded-[8px] p-4 sm:p-6 flex flex-col gap-8 backdrop-blur-[24px] bg-surface-06">
        <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ Documents: documents.length }} />

        {tab === "Documents" ? (
          documents.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/40">No documents yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
              {documents.map((d) => (
                <DocumentCard key={d.id} document={d} onOpen={() => setOpened(d)} />
              ))}
            </div>
          )
        ) : (
          <p className="py-12 text-center text-sm text-white/40">{tab} is coming soon.</p>
        )}
      </div>

      <ViewDocumentModal document={opened} onClose={() => setOpened(null)} />
      {adding && <AddDocumentModal onClose={() => setAdding(false)} onAdd={addDocument} />}
    </div>
  );
}
