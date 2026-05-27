"use client"

import * as React from "react"
import { Plus, Export, UploadSimple, Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccountCard } from "@/features/accounts/components/account-card"
import { AccountDetailDialog } from "@/features/accounts/components/account-detail-dialog"
import { AddAccountDialog } from "@/features/accounts/components/add-account-dialog"
import { ImportAccountsDialog } from "@/features/accounts/components/import-accounts-dialog"
import { exportAccounts } from "@/features/accounts/api/client-api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import {
  AccountCardsGridSkeleton,
  AccountCardSkeleton,
} from "@/components/ui/loading-skeletons"

export default function AccountsPage() {
  const {
    accounts,
    accountData,
    loading,
    refresh,
    removeAccount,
    removeAllAccounts,
  } = useDashboardData()

  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [deleteAllOpen, setDeleteAllOpen] = React.useState(false)
  const [deletingAll, setDeletingAll] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [detailAccountId, setDetailAccountId] = React.useState<string | null>(
    null
  )

  const handleExport = React.useCallback(async () => {
    setExporting(true)
    try {
      const data = await exportAccounts()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mimo-accounts-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    } finally {
      setExporting(false)
    }
  }, [])

  const handleDelete = React.useCallback(
    async (id: string) => {
      try {
        await removeAccount(id)
      } catch {
        // ignore
      }
    },
    [removeAccount]
  )

  const handleDeleteAll = React.useCallback(async () => {
    setDeletingAll(true)
    try {
      await removeAllAccounts()
    } catch {
      // ignore
    } finally {
      setDeletingAll(false)
      setDeleteAllOpen(false)
    }
  }, [removeAllAccounts])

  const detailAccount = detailAccountId
    ? (accountData.get(detailAccountId) ?? null)
    : null

  return (
    <div className="p-4 md:p-6">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Account</span>
          {accounts.length > 0 && (
            <Badge variant="secondary">{accounts.length}</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setImportDialogOpen(true)}
          >
            <UploadSimple className="mr-1.5 size-3" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleExport}
            disabled={exporting || accounts.length === 0}
          >
            <Export className="mr-1.5 size-3" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setDeleteAllOpen(true)}
            disabled={accounts.length === 0}
          >
            <Trash className="mr-1.5 size-3" />
            Delete All
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="mr-1.5 size-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!loading && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <p className="text-sm">No accounts added yet.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="mr-1.5 size-3" />
            Add Your First Account
          </Button>
        </div>
      )}

      {/* Loading initial */}
      {loading && accounts.length === 0 && (
        <div className="p-4 md:p-6">
          <AccountCardsGridSkeleton />
        </div>
      )}

      {/* Account cards grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const data = accountData.get(account.id)
            if (!data) {
              return <AccountCardSkeleton key={account.id} />
            }
            return (
              <AccountCard
                key={account.id}
                account={data}
                onView={() => setDetailAccountId(account.id)}
                onDelete={() => handleDelete(account.id)}
              />
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <AddAccountDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdded={refresh}
      />
      <ImportAccountsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImported={refresh}
      />
      <AccountDetailDialog
        account={detailAccount}
        open={detailAccountId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailAccountId(null)
        }}
      />

      {/* Delete All confirmation dialog */}
      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all accounts?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove all {accounts.length} account
            {accounts.length !== 1 ? "s" : ""}. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAllOpen(false)}
              disabled={deletingAll}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deletingAll}
            >
              {deletingAll ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
