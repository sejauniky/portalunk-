'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Check, FileText, Image as ImageIcon, Trash2, Upload, Video, X, Link as LinkIcon } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE_BYTES = 80 * 1024 * 1024;
const STORAGE_BUCKET = "dj-presskit";

type UploadStatus = "pending" | "uploading" | "complete" | "error";

const categoryOptions = [
  { value: "logo", label: "Logo", icon: "🎨" },
  { value: "presskit", label: "Press Kit", icon: "📷" },
  { value: "backdrop", label: "Backdrop", icon: "🖼️" },
  { value: "audios", label: "Áudios", icon: "🎧" },
  { value: "outros", label: "Outros", icon: "🗂️" },
] as const;

type MediaCategory = (typeof categoryOptions)[number]["value"];
type MediaFileType = "image" | "video" | "audio" | "document";

type UploadItem = {
  file: File;
  category: MediaCategory;
  preview?: string;
  progress: number;
  status: UploadStatus;
  title: string;
  errorMessage?: string;
};

interface MediaUploadProps {
  djId?: string;
  djName?: string;
  onUploadComplete?: () => void;
  onCancel?: () => void;
}

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
  if (file.type.startsWith("video/")) return <Video className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
};

const sanitizeForPath = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const source = error as Record<string, unknown>;
    for (const key of ["message", "error_description", "error", "details", "hint"]) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return "Falha ao enviar arquivo.";
};

const mapMimeTypeToFileType = (mime: string): MediaFileType => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
};

const inferCategoryFromFile = (file: File): MediaCategory => {
  if (file.type.startsWith("audio/")) return "audios";
  if (file.type.startsWith("image/")) return "outros";
  if (file.type.startsWith("video/")) return "outros";
  return "presskit";
};

export function MediaUpload({ djId, onUploadComplete, onCancel }: MediaUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const revokePreview = useCallback((preview?: string) => {
    if (preview) URL.revokeObjectURL(preview);
  }, []);

  const clearAllFiles = useCallback(() => {
    setUploadItems((prev) => {
      prev.forEach((item) => revokePreview(item.preview));
      return [];
    });
  }, [revokePreview]);

  const updateItem = useCallback((index: number, payload: Partial<UploadItem>) => {
    setUploadItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...payload } : item))
    );
  }, []);

  const handleFileSelection = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;

      const files = Array.from(fileList);
      const validFiles = files.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);
      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE_BYTES);

      if (oversized.length) {
        toast({
          variant: "destructive",
          title: "Arquivo excede o limite",
          description: `Os arquivos ${oversized.map((f) => f.name).join(", ")} excedem 80MB.`,
        });
      }

      setUploadItems((prev) => [
        ...prev,
        ...validFiles.map((file) => ({
          file,
          category: inferCategoryFromFile(file),
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          progress: 0,
          status: "pending" as UploadStatus,
          title: file.name,
        })),
      ]);
    },
    [toast]
  );

  const handleRemove = useCallback(
    (index: number) => {
      setUploadItems((prev) => {
        const target = prev[index];
        if (target?.preview) revokePreview(target.preview);
        return prev.filter((_, i) => i !== index);
      });
    },
    [revokePreview]
  );

  const handleUploadAll = useCallback(async () => {
    if (!djId) {
      toast({
        variant: "destructive",
        title: "DJ não encontrado",
        description: "É necessário selecionar um DJ.",
      });
      return;
    }

    const pendingItems = uploadItems.filter((i) => i.status === "pending");
    if (!pendingItems.length) {
      toast({ title: "Nenhum arquivo para enviar" });
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const [index, item] of uploadItems.entries()) {
      if (item.status !== "pending") continue;

      try {
        updateItem(index, { status: "uploading", progress: 10 });

        const ext = item.file.name.split(".").pop();
        const name = `${sanitizeForPath(item.title)}-${Date.now()}.${ext}`;
        const path = `${djId}/${item.category}/${name}`;

        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, item.file);

        if (error) throw error;

        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

        await supabase.from("media_files").insert({
          dj_id: djId,
          file_name: item.title,
          file_category: item.category,
          file_size: item.file.size,
          file_type: mapMimeTypeToFileType(item.file.type),
          file_url: pub?.publicUrl,
          uploaded_by: user?.id,
          is_public: true,
        });

        updateItem(index, { status: "complete", progress: 100 });
        successCount++;
      } catch (err) {
        updateItem(index, { status: "error", errorMessage: extractErrorMessage(err) });
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast({ title: "Upload concluído", description: `${successCount} arquivos enviados.` });
      onUploadComplete?.();
      clearAllFiles();
    }
  }, [djId, uploadItems, toast, user?.id, updateItem, clearAllFiles, onUploadComplete]);

  useEffect(() => {
    return () => uploadItems.forEach((i) => revokePreview(i.preview));
  }, [uploadItems, revokePreview]);

  return (
    <div className="flex flex-col max-h-[80vh] overflow-hidden bg-[#0b0614] text-white rounded-2xl">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200">Upload de Mídia</label>
          <p className="text-xs text-gray-400">
            Adicione press kits, logos, backdrops e outros materiais do DJ
          </p>

          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${isDragOver
                ? "border-purple-400 bg-purple-500/10"
                : "border-purple-700/50 bg-black/60 hover:border-purple-400/80"
              }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileSelection(e.dataTransfer.files);
            }}
          >
            <Upload size={28} className="text-purple-200" />
            <p className="text-sm font-medium">Arraste arquivos ou clique</p>
            <p className="text-xs text-gray-400">
              Imagens, vídeos, documentos • Máx 80MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.zip,.rar"
            className="hidden"
            onChange={(e) => handleFileSelection(e.target.files)}
          />
        </div>

        {uploadItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-lg">Arquivos ({uploadItems.length})</h4>
              <button
                onClick={clearAllFiles}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                Limpar tudo
              </button>
            </div>

            <div className="space-y-3">
              {uploadItems.map((file, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/40 p-3"
                >
                  <div className="flex gap-3">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt="Preview"
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
                        {getFileIcon(file.file)}
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="text"
                        value={file.title}
                        onChange={(e) =>
                          updateItem(index, { title: e.target.value })
                        }
                        className="w-full bg-transparent border-none text-sm font-medium focus:outline-none"
                      />
                      <p className="text-xs text-gray-400">
                        {formatFileSize(file.file.size)}
                      </p>
                      {file.status === "uploading" && (
                        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-700">
                          <div
                            className="h-full bg-purple-500 transition-all"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === "complete" && (
                        <Check className="text-green-400 w-5 h-5" />
                      )}
                      {file.status === "error" && (
                        <X className="text-red-400 w-5 h-5" />
                      )}
                      <button
                        onClick={() => handleRemove(index)}
                        disabled={file.status === "uploading"}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <select
                    value={file.category}
                    onChange={(e) =>
                      updateItem(index, { category: e.target.value as MediaCategory })
                    }
                    disabled={file.status !== "pending"}
                    className="rounded-lg border border-purple-500/30 bg-black/60 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500/50"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {uploadItems.length > 0 && (
        <div className="border-t border-white/10 p-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/20 px-5 py-2 text-sm text-gray-200 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={handleUploadAll}
            disabled={isUploading || uploadItems.every((f) => f.status !== "pending")}
            className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 inline-block mr-2" />
            Enviar {uploadItems.filter((f) => f.status === "pending").length}
          </button>
        </div>
      )}
    </div>
  );
}
