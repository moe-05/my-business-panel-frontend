import { customerApi } from "@/api/customer.api";

import type { CreateCustomerRequest } from "@/interfaces/api/requests/CreateCustomerRequest.interface";
import type { UpdateCustomerRequest } from "@/interfaces/api/requests/UpdateCustomerRequest.interface";
import type { Customer } from "@/interfaces/entities/Customer.interface";

export const getCustomerByDocNumber = async (
  docNumber: string,
): Promise<Customer | null> => customerApi.getByDocNumber(docNumber);

export const createCustomer = async (
  data: CreateCustomerRequest,
): Promise<Customer> => customerApi.create(data);

export const updateCustomer = async (
  customerId: string,
  data: UpdateCustomerRequest,
): Promise<Customer> => customerApi.update(customerId, data);

export const deleteCustomer = async (
  customerId: string,
): Promise<{ message: string }> => customerApi.delete(customerId);
