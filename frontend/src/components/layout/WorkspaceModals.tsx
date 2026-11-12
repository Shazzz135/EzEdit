import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import { MAX_TAB_LIMIT, MAX_IMPORT_DIMENSION, type DocumentState } from '@/types/document'
import { type StorageQuotaEstimate } from '@/services/storage'
import { TransferEditsModal } from './TransferEditsModal'
import { type TransferEditCategories } from '@/features/tabs/useDocumentStore'
import { ExportModal, ExportAllModal } from '@/features/export'

export interface WorkspaceModalsProps {
  tabLimitModalOpen: boolean
  onCloseTabLimitModal: () => void
  oversizedFile: { file: File; width: number; height: number } | null
  onCloseOversizedModal: () => void
  onDownscaleAndImport: () => void
  unsavedDoc: { id: string; name: string } | null
  onKeepUnsavedDoc: () => void
  onDiscardUnsavedDoc: () => void
  quotaWarning: StorageQuotaEstimate | null
  onDismissQuotaWarning: () => void
  transferModalOpen?: boolean
  onCloseTransferModal?: () => void
  exportModalOpen?: boolean
  onCloseExportModal?: () => void
  exportAllModalOpen?: boolean
  onCloseExportAllModal?: () => void
  onExportSuccess?: (docId: string) => void
  onExportAllSuccess?: (docIds: string[]) => void
  activeDoc?: DocumentState
  documents?: DocumentState[]
  onTransferEdits?: (
    sourceId: string,
    targetIds: string[],
    categories: TransferEditCategories
  ) => void
}

export const WorkspaceModals: React.FC<WorkspaceModalsProps> = ({
  tabLimitModalOpen,
  onCloseTabLimitModal,
  oversizedFile,
  onCloseOversizedModal,
  onDownscaleAndImport,
  unsavedDoc,
  onKeepUnsavedDoc,
  onDiscardUnsavedDoc,
  quotaWarning,
  onDismissQuotaWarning,
  transferModalOpen = false,
  onCloseTransferModal = () => {},
  exportModalOpen = false,
  onCloseExportModal = () => {},
  exportAllModalOpen = false,
  onCloseExportAllModal = () => {},
  onExportSuccess,
  onExportAllSuccess,
  activeDoc,
  documents = [],
  onTransferEdits = () => {},
}) => {
  return (
    <>
      <ExportModal
        isOpen={exportModalOpen}
        document={activeDoc}
        onClose={onCloseExportModal}
        onExportSuccess={onExportSuccess}
      />
      <ExportAllModal
        isOpen={exportAllModalOpen}
        documents={documents}
        onClose={onCloseExportAllModal}
        onExportAllSuccess={onExportAllSuccess}
      />
      <TransferEditsModal
        isOpen={transferModalOpen}
        sourceDoc={activeDoc}
        documents={documents}
        onClose={onCloseTransferModal}
        onTransfer={onTransferEdits}
      />
      <Modal isOpen={tabLimitModalOpen} onClose={onCloseTabLimitModal} title="Maximum Tabs Reached">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#C0C0D0] space-y-2">
            <p>You have reached the maximum limit of {MAX_TAB_LIMIT} open document tabs.</p>
            <p className="text-[#808090]">Please close an open tab before importing a new image to maintain optimal browser performance.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" onClick={onCloseTabLimitModal}>Understood</Button>
        </div>
      </Modal>

      <Modal isOpen={!!oversizedFile} onClose={onCloseOversizedModal} title="Large Image Safeguard">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#C0C0D0] space-y-2">
            <p>
              This image is <strong className="text-[#F4F4F6]">{oversizedFile?.width} × {oversizedFile?.height}px</strong>, which exceeds the recommended {MAX_IMPORT_DIMENSION}px hardware limit.
            </p>
            <p className="text-[#808090]">Would you like to downscale it to {MAX_IMPORT_DIMENSION}px to prevent high-resolution GPU memory lag?</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCloseOversizedModal}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={onDownscaleAndImport}>Downscale & Import</Button>
        </div>
      </Modal>

      <Modal isOpen={!!unsavedDoc} onClose={onKeepUnsavedDoc} title="Unsaved Modifications">
        <p className="text-xs text-[#C0C0D0]">
          Document &quot;{unsavedDoc?.name}&quot; has unexported changes. Are you sure you want to close it?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onKeepUnsavedDoc}>Keep Tab</Button>
          <Button
            variant="default"
            size="sm"
            onClick={onDiscardUnsavedDoc}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            Discard & Close
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!quotaWarning} onClose={onDismissQuotaWarning} title="Storage Quota Warning">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#C0C0D0] space-y-2">
            <p>Device storage is <strong className="text-amber-400">{Math.round(quotaWarning?.percentUsed || 0)}%</strong> used.</p>
            <p className="text-[#808090]">To prevent data loss, please close unneeded document tabs or free device storage space.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" onClick={onDismissQuotaWarning}>Understood</Button>
        </div>
      </Modal>
    </>
  )
}
