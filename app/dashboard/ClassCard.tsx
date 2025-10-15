"use client";
import Link from "next/link";
import ShareClassModal from "@/components/ShareClassModal";

export default function ClassCard({ cls }: { cls: { id: string; name: string; createdAt?: string } }) {
  return (
    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between gap-3 hover:shadow-sm transition-shadow">
      <div>
        <div className="font-medium">{cls.name}</div>
        {cls.createdAt && (
          <div className="text-xs text-gray-500 mt-1">
            {new Date(cls.createdAt).toLocaleString()}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Link
          href={`/classes/${cls.id}`}
          className="btn-primary px-3 py-1.5 rounded-lg"
        >
          Abrir
        </Link>
        <ShareClassModal classId={cls.id} />
      </div>
    </div>
  );
}
