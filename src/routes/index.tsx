import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CreateForm } from "@/components/CreateForm";
import { PreviewPanel } from "@/components/PreviewPanel";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3500);
  };

  return (
    <div
      dir="rtl"
      className="flex h-screen w-full font-sans antialiased"
      style={{ backgroundColor: "#F5F5F7" }}
    >
      <Sidebar />
      <CreateForm onGenerate={handleGenerate} />
      <PreviewPanel isGenerating={isGenerating} />
    </div>
  );
}
