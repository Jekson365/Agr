import { useState } from 'react';

import { resolveAssetUrl } from '@/services/api-client';
import { uploadProfileImage } from '@/services/auth-service';

export function usePickedImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [path, setPath] = useState('');

  function reset(existingPath: string) {
    setFile(null);
    setPreview(null);
    setPath(existingPath);
  }

  function pick(picked: File) {
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  async function commit(): Promise<string> {
    if (!file) return path;
    const uploaded = await uploadProfileImage(file);
    setFile(null);
    setPreview(null);
    setPath(uploaded);
    return uploaded;
  }

  return {
    previewUrl: preview ?? (path ? resolveAssetUrl(path) : null),
    reset,
    pick,
    commit,
  };
}
