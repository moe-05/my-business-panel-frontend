import { employeeApi } from "@/api/employee.api";

import type { UpdateEmployeePayload } from "@/interfaces/entities/Employee.interface";

export const updateEmployee = async (
  employeeId: string,
  data: UpdateEmployeePayload,
): Promise<void> => employeeApi.update(employeeId, data);
