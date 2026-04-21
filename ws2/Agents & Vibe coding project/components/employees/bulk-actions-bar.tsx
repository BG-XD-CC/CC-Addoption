"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Loader2 } from "lucide-react";
import { useState } from "react";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkAction: (status: string) => Promise<void>;
}

export function BulkActionsBar({ selectedCount, onBulkAction }: BulkActionsBarProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: string) => {
    setLoading(true);
    await onBulkAction(status);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
            <span className="text-sm font-medium">
              {selectedCount} selected
            </span>
            <div className="h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => handleAction("Active")}
            >
              {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserCheck className="mr-1 h-4 w-4" />}
              Set Active
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => handleAction("On Leave")}
            >
              Set On Leave
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={loading}
              onClick={() => handleAction("Offboarded")}
            >
              <UserX className="mr-1 h-4 w-4" />
              Offboard
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
