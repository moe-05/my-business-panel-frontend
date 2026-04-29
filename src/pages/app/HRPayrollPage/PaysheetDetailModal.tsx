import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

import { paysheetApi } from "@/api/paysheet.api";
import { payrollMovementApi } from "@/api/payrollMovement.api";

import type { Column } from "@/interfaces/components/ui/TableProps.interface";
import type {
  HrEmployeeRecord,
  HrPaysheet,
  HrPaysheetDetail,
  HrPayrollMovement,
} from "@/interfaces/entities/Hr.interface";

interface PaysheetDetailModalProps {
  isOpen: boolean;
  paysheet: HrPaysheet | null;
  employees: HrEmployeeRecord[];
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  `CRC ${Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function PaysheetDetailModal({
  isOpen,
  paysheet,
  employees,
  onClose,
}: PaysheetDetailModalProps) {
  const [details, setDetails] = useState<HrPaysheetDetail[]>([]);
  const [movements, setMovements] = useState<HrPayrollMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !paysheet) {
      setDetails([]);
      setMovements([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    Promise.all([
      paysheetApi.getDetails(paysheet.paysheet_id),
      payrollMovementApi.listByPaysheet(paysheet.paysheet_id),
    ])
      .then(([nextDetails, nextMovements]) => {
        setDetails(nextDetails);
        setMovements(nextMovements);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, paysheet]);

  const employeeMap = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          employee.employee_id,
          `${employee.first_name} ${employee.last_name}`,
        ]),
      ),
    [employees],
  );

  const detailColumns: Column[] = [
    {
      key: "employee_id",
      label: "Empleado",
      width: "28%",
      render: (value: string) => employeeMap.get(value) ?? value,
    },
    {
      key: "gross_salary",
      label: "Bruto",
      width: "18%",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "total_earnings",
      label: "Ingresos",
      width: "18%",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "total_deduction",
      label: "Deducciones",
      width: "18%",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "net_salary",
      label: "Neto",
      width: "18%",
      render: (value: number) => formatCurrency(value),
    },
  ];

  const movementColumns: Column[] = [
    { key: "concept_id", label: "Concepto", width: "16%" },
    {
      key: "base_amount",
      label: "Base",
      width: "18%",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "calculated_amount",
      label: "Aplicado",
      width: "18%",
      render: (value: number) => formatCurrency(value),
    },
    { key: "description", label: "Descripción", width: "48%" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de nómina"
      size="lg"
    >
      {paysheet && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <Badge variant={paysheet.status_id === 2 ? "green" : "secondary"}>
              {paysheet.status_id === 2 ? "Procesada" : "Pendiente"}
            </Badge>
            <p className="text-sm text-gray-600">
              Periodo {paysheet.period_start} a {paysheet.period_end}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Detalles por empleado
            </h3>
            <Table
              columns={detailColumns}
              data={details}
              isLoading={isLoading}
              emptyMessage="Esta nómina todavía no tiene detalles generados"
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Movimientos
            </h3>
            <Table
              columns={movementColumns}
              data={movements}
              isLoading={isLoading}
              emptyMessage="No hay movimientos registrados para esta nómina"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
