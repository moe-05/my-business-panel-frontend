import { userApi } from "@/api/user.api";

import type { CreateUserRequest } from "@/interfaces/api/requests/CreateUserRequest.interface";
import type { UpdateUserRequest } from "@/interfaces/api/requests/UpdateUserRequest.interface";
import type { User } from "@/interfaces/entities/User.interface";
import type { CreateUserResponse } from "@/interfaces/api/responses/CreateUserResponse.interface";

export const createUser = async (
  data: CreateUserRequest,
): Promise<CreateUserResponse> => userApi.create(data);

export const updateUser = async (
  userId: string,
  data: UpdateUserRequest,
): Promise<User> => userApi.update(userId, data);

export const deleteUser = async (
  userId: string,
): Promise<{ message: string }> => userApi.delete(userId);
