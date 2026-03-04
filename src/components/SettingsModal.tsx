"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Camera, User } from "lucide-react";
import { toast } from "sonner";
import CloseButton from "./ui/CloseButton";
import { createClient } from "../lib/supabase/client";

const AVATAR_BUCKET = "avatars";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; user_metadata?: { full_name?: string; avatar_url?: string }; email?: string } | null;
  onSuccess?: () => void;
}

export default function SettingsModal({ isOpen, onClose, user, onSuccess }: SettingsModalProps) {
  const [fullName, setFullName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (isOpen && user) {
      const name = user.user_metadata?.full_name ?? "";
      setFullName(name);
      setError(name.trim() === "" ? "Full name is required." : null);
    }
  }, [isOpen, user?.id, user?.user_metadata?.full_name]);

  const currentAvatarUrl = selectedFile ? previewUrl : (user?.user_metadata?.avatar_url ?? null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to update your profile.");
      return;
    }


    if (fullName.trim() === "") {
      setError("Full name is required.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      let avatarUrl: string | undefined;
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `public/${user.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });
        if (uploadError) {
          toast.error(uploadError.message);
          return;
        }
        const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim() || undefined,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Profile updated");
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 p-6 shadow-xl backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold tracking-widest text-neutral-800 dark:text-neutral-200 uppercase">
                Account Settings
              </h3>
              <CloseButton onClose={handleClose} size={18} />
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-25 h-25 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0">
                {currentAvatarUrl ? (
                  <Image
                    src={currentAvatarUrl}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized={!!previewUrl}
                  />
                ) : (
                  <User size={36} className="text-neutral-500 dark:text-neutral-400" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="hover:cursor-pointer inline-flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-60"
              >
                <Camera size={16} />
                Upload Image
              </button>
            </div>

            {/* Full Name */}
            <div className="mb-6">
              <label htmlFor="settings-full-name" className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="settings-full-name"
                type="text"
                value={fullName}
                onChange={(e) => {
                const v = e.target.value;
                setFullName(v);
                setError(v.trim() === "" ? "Full name is required." : null);
              }}
                placeholder="Your display name"
                disabled={isLoading}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 px-3 py-2.5 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-indigo-500 dark:focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:focus:ring-purple-500/50 disabled:opacity-60"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm font-medium">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="cursor-pointer px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading || fullName.trim() === ""}
                className="hover:cursor-pointer inline-flex items-center justify-center rounded-lg bg-indigo-600 dark:bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-purple-500/50 disabled:opacity-60 disabled:pointer-events-none min-w-[100px]"
              >
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
