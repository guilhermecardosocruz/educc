"use client";
import ShareClassModal from "@/components/ShareClassModal";

export default function ClassCard({ cls }: { cls: { id: string; name: string } }) {
  return (
    <div className="border rounded-xl p-4 flex justify-between items-center">
      <div>
        <h3 className="font-semibold">{cls.name}</h3>
      </div>
      <div className="flex gap-2">
        <ShareClassModal classId={cls.id} />
      </div>
    </div>
  );
}
