import React, { useState } from "react";
import { api } from "../../api/client";
import { endpoints } from "../../api/endpoints";
import { Button } from "../../design/Button";
import { Input } from "../../design/Input";
import { Card } from "../../design/Card";
import { tokens } from "../../theme/tokens";

export const EvidenceUpload: React.FC<{ caseId: string; onUpload?: () => void }> = ({
  caseId,
  onUpload
}) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("caseId", caseId);
      await api.post(endpoints.evidenceUpload, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage("Evidence uploaded successfully");
      onUpload?.();
    } catch (error) {
      setMessage("Upload failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <h2>Upload Evidence</h2>
      <form onSubmit={handleUpload}>
        <Input type="file" name="file" required style={{ marginBottom: tokens.spacing(1) }} />
        <Button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        {message && (
          <p style={{ marginTop: tokens.spacing(1), color: tokens.color.textLight }}>
            {message}
          </p>
        )}
      </form>
    </Card>
  );
};
