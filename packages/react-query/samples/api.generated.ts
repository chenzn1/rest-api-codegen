import * as reactQuery from "@tanstack/react-query";
import { apiFetcher as fetcher } from "./utils/fetcher";

      function getUrl(url: string, params?: Record<string, string | number>) {
        if (!params) {
          return url
        }
        let nUrl = url 
        for(const field in params) {
          nUrl = nUrl.replace(`:${field}`, `${params[field]}`)
        }
        return nUrl
      }
    
export interface GetUsersRequest {
 query: {
 limit: number
offset: number 
}
body: undefined
params: undefined 
}
export interface GetUsersResponse {
 data: {
 users: {
 id: string
name: string
age?: number 
}[] 
} 
}
export function useGetUsersQuery(request: GetUsersRequest,options: reactQuery.QueryOptions<GetUsersResponse>) {
      return reactQuery.useQuery<GetUsersResponse>({
        queryKey: ["getUsers", JSON.stringify(request)],
        queryFn: () => fetcher<GetUsersResponse>({
          method: "GET",
          
            url: getUrl("/users", request.params),
            query: request.query,
            body: request.body,
          
          
        }),
        ...options,
      });
    }
export interface GetUserRequest {
 query?: {
 limit: number
offset: number 
}
body: undefined
params?: {
 id: string 
} 
}
export interface GetUserResponse {
 data: {
 user: {
 id: string
name: string
age?: number 
} 
} 
}
export function useGetUserQuery(request: GetUserRequest,options: reactQuery.QueryOptions<GetUserResponse>) {
      return reactQuery.useQuery<GetUserResponse>({
        queryKey: ["getUser", JSON.stringify(request)],
        queryFn: () => fetcher<GetUserResponse>({
          method: "GET",
          
            url: getUrl("/users/:id", request.params),
            query: request.query,
            body: request.body,
          
          
        }),
        ...options,
      });
    }
export interface CreateUserRequest {
 query: undefined
body?: {
 name?: string 
}
params: undefined 
}
export interface CreateUserResponse {
 data: {
 user: {
 id: string
name: string
age: number 
} 
} 
}
export function useCreateUserMutation(request: CreateUserRequest,options: reactQuery.MutationOptions<CreateUserResponse>) {
      return reactQuery.useMutation<CreateUserResponse>({
        mutationKey: ["createUser"],
        mutationFn: () => fetcher<CreateUserResponse>({
          method: "post",
          
            url: getUrl("/users", request.params),
            query: request.query,
            body: request.body,
          
        }),
        ...options,
      });
    }