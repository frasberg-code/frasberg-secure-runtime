import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, X, Loader2, FileCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { sofiaCoreApi } from '@/services/api';
import { toast } from 'sonner';

const SofiaCoreManager = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailFile, setDetailFile] = useState(null);
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingDeploy, setLoadingDeploy] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  const loadSyncStatus = async () => {
    try {
      const status = await sofiaCoreApi.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const data = await sofiaCoreApi.getFiles();
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadSyncStatus();
    loadFiles();
  }, []);

  const handleRunSync = async () => {
    setLoadingSync(true);
    try {
      const status = await sofiaCoreApi.runSync();
      setSyncStatus(status);
      await loadFiles();
      toast.success(`Synced ${status.files_synced} files`);
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
    } finally {
      setLoadingSync(false);
    }
  };

  const handleDeploy = async () => {
    if (selectedIds.length === 0) return;
    setLoadingDeploy(true);
    try {
      const results = await sofiaCoreApi.deployFiles(selectedIds);
      const deployed = Object.values(results).filter(r => r === 'deployed').length;
      toast.success(`Deployed ${deployed} files`);
      await loadFiles();
      setSelectedIds([]);
    } catch (error) {
      console.error('Deploy failed:', error);
      toast.error('Deploy failed');
    } finally {
      setLoadingDeploy(false);
    }
  };

  const handleViewFile = async (file) => {
    try {
      const fullFile = await sofiaCoreApi.getFile(file.id);
      setDetailFile(fullFile);
    } catch (error) {
      console.error('Failed to load file details:', error);
      toast.error('Failed to load file details');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === files.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(files.map(f => f.id));
    }
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      <h1 className="text-xl font-semibold text-white mb-4">Sofia Core Management</h1>

      {/* Sync Status Panel */}
      <div className="bg-[#0f0f10] border border-[#2a2a2c] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white">Sync Status</h2>
          <Button
            onClick={handleRunSync}
            disabled={loadingSync}
            size="sm"
            className="h-8 bg-[#2a2a2c] hover:bg-[#3a3a3c] text-white"
          >
            {loadingSync ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {loadingSync ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
        {syncStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#6b6b6b] mb-1">Last Run</div>
              <div className="text-white">{formatDate(syncStatus.last_run_at)}</div>
            </div>
            <div>
              <div className="text-[#6b6b6b] mb-1">Last Success</div>
              <div className="text-green-400">{formatDate(syncStatus.last_success_at)}</div>
            </div>
            <div>
              <div className="text-[#6b6b6b] mb-1">Files Synced</div>
              <div className="text-white">{syncStatus.files_synced}</div>
            </div>
            <div>
              <div className="text-[#6b6b6b] mb-1">Duration</div>
              <div className="text-white">{syncStatus.duration_seconds?.toFixed(2)}s</div>
            </div>
          </div>
        ) : (
          <div className="text-[#6b6b6b] text-sm">Loading status...</div>
        )}
        {syncStatus?.last_error && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-red-400 text-xs">{syncStatus.last_error}</div>
          </div>
        )}
      </div>

      {/* Files Panel */}
      <div className="flex-1 bg-[#0f0f10] border border-[#2a2a2c] rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2c]">
          <h2 className="text-sm font-medium text-white">Files ({files.length})</h2>
          <Button
            onClick={handleDeploy}
            disabled={selectedIds.length === 0 || loadingDeploy}
            size="sm"
            className="h-8 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            {loadingDeploy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Deploy Selected ({selectedIds.length})
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {loadingFiles ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#6b6b6b]" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center p-8 text-[#6b6b6b]">
              No files synced yet. Click "Sync Now" to fetch files from GitHub.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2c] text-[#6b6b6b]">
                  <th className="p-3 text-left w-10">
                    <Checkbox
                      checked={files.length > 0 && selectedIds.length === files.length}
                      onCheckedChange={toggleSelectAll}
                      className="border-[#3a3a3c]"
                    />
                  </th>
                  <th className="p-3 text-left">Path</th>
                  <th className="p-3 text-left w-20">Status</th>
                  <th className="p-3 text-left w-20">Size</th>
                  <th className="p-3 text-left w-24">Deployed</th>
                  <th className="p-3 text-left w-40">Last Synced</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => handleViewFile(file)}
                    className="border-b border-[#1a1a1c] hover:bg-[#1a1a1c] cursor-pointer transition-colors"
                  >
                    <td className="p-3" onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}>
                      <Checkbox
                        checked={selectedIds.includes(file.id)}
                        className="border-[#3a3a3c]"
                      />
                    </td>
                    <td className="p-3 text-white font-mono text-xs flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-[#6b6b6b]" />
                      {file.path}
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                        file.status === 'ok' ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                      )}>
                        {file.status === 'ok' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {file.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#a0a0a0]">{file.size}</td>
                    <td className="p-3">
                      <span className={cn(
                        "text-xs",
                        file.is_deployed ? "text-green-400" : "text-[#6b6b6b]"
                      )}>
                        {file.is_deployed ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-3 text-[#6b6b6b] text-xs">{formatDate(file.last_synced_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </div>

      {/* File Detail Drawer */}
      {detailFile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setDetailFile(null)}>
          <div 
            className="w-full max-w-xl bg-[#0a0a0b] h-full flex flex-col border-l border-[#2a2a2c]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2c]">
              <h3 className="text-sm font-medium text-white">File Detail</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailFile(null)}
                className="text-[#6b6b6b] hover:text-white"
              >
                Close
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[#6b6b6b] mb-1">Path</div>
                  <div className="text-white font-mono">{detailFile.path}</div>
                </div>
                <div>
                  <div className="text-[#6b6b6b] mb-1">Repository</div>
                  <div className="text-white">{detailFile.repo}</div>
                </div>
                <div>
                  <div className="text-[#6b6b6b] mb-1">Branch</div>
                  <div className="text-white">{detailFile.branch}</div>
                </div>
                <div>
                  <div className="text-[#6b6b6b] mb-1">SHA</div>
                  <div className="text-white font-mono text-xs">{detailFile.sha}</div>
                </div>
                <div>
                  <div className="text-[#6b6b6b] mb-1">Status</div>
                  <div className="text-white">{detailFile.status}</div>
                </div>
                <div>
                  <div className="text-[#6b6b6b] mb-1">Size</div>
                  <div className="text-white">{detailFile.size} bytes</div>
                </div>
                <div>
                  <div className="text-[#6b6b6b] mb-1">Deployed</div>
                  <div className={detailFile.is_deployed ? "text-green-400" : "text-[#6b6b6b]"}>
                    {detailFile.is_deployed ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <div className="text-[#6b6b6b] mb-1">Last Synced</div>
                  <div className="text-white">{formatDate(detailFile.last_synced_at)}</div>
                </div>
                {detailFile.deployed_at && (
                  <div>
                    <div className="text-[#6b6b6b] mb-1">Deployed At</div>
                    <div className="text-white">{formatDate(detailFile.deployed_at)}</div>
                  </div>
                )}
                <div>
                  <div className="text-[#6b6b6b] mb-1">Content</div>
                  <pre className="mt-2 p-4 bg-[#1a1a1c] rounded-lg text-xs text-[#a0a0a0] overflow-auto max-h-[50vh] font-mono whitespace-pre-wrap">
                    {detailFile.content || 'No content available'}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default SofiaCoreManager;
