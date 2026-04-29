import { useLoaderData } from "react-router-dom";

import { Toast } from "@/components/ui/Toast";

import type { RefundsPageLoaderData } from "@/router/loaders/returns.loaders";

import { RefundModeTabs } from "./RefundModeTabs";
import { RefundsHistoryTable } from "./RefundsHistoryTable";
import { SaleContextPanel } from "./SaleContextPanel";
import { SaleLookupForm } from "./SaleLookupForm";
import { useRefundFlow } from "@/hooks/useRefundFlow";

export function RefundsPage() {
  const { initialReturns } = useLoaderData() as RefundsPageLoaderData;

  const flow = useRefundFlow({ initialReturns });

  return (
    <div className="p-6 lg:p-8">
      {flow.toast && (
        <Toast
          mode={flow.toast.mode}
          message={flow.toast.message}
          onClose={() => flow.setToast(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reembolsos</h1>
        <p className="text-gray-600">
          Procese reembolsos parciales o completos sobre una venta facturada.
        </p>
      </div>

      <RefundModeTabs mode={flow.mode} onChange={flow.switchMode} />

      <SaleLookupForm
        saleIdInput={flow.saleIdInput}
        onChange={flow.setSaleIdInput}
        onLookup={flow.lookupSale}
        onClear={flow.clearSale}
        isLoading={flow.isLoadingContext}
        error={flow.contextError}
        hasContext={Boolean(flow.context)}
      />

      {flow.context && (
        <SaleContextPanel
          context={flow.context}
          mode={flow.mode}
          currencySymbol={flow.currencySymbol}
          selections={flow.selections}
          onToggleItem={flow.toggleItemSelection}
          onUpdateQuantity={flow.updateItemQuantity}
          refundMethod={flow.refundMethod}
          onRefundMethodChange={flow.setRefundMethod}
          returnStatusId={flow.returnStatusId}
          onReturnStatusChange={flow.setReturnStatusId}
          refundTotal={flow.refundTotal}
          isSubmitting={flow.isSubmitting}
          canSubmitPartial={flow.productsToRefund.length > 0}
          onSubmitPartial={flow.submitPartial}
          onSubmitFull={flow.submitFull}
        />
      )}

      <RefundsHistoryTable returns={flow.returns} />
    </div>
  );
}
