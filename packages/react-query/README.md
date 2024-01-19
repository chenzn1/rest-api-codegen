# REST API Code Generator For React-Query

## Installation

```bash
// npm
npm install @rest-api-codegen/react-query --save-dev

// yarn
yarn add @rest-api-codegen/react-query -D

// pnpm
pnpm add @rest-api-codegen/react-query -D
```

## Configuration

### Schema directory
command options: `-schema-directory` `-s`

Generator will automatically scan all json files in schema directory.

{schema directory}/sample.json 
```json
{
  "types": {
    "User": {
      "id!": "string",
      "name!": "string",
      "age": "number"
    }
  },
  "apis": [
    {
      "name": "getUsers",
      "method": "GET",
        "url": "/users",
        "request": {
          "query!": {
            "limit!": "number",
            "offset!": "number"
          }
        },
        "response": {
          "data!": {
            "users!": ["User"]
          }
        }
    },
    {
      "name": "createUser",
      "method": "post",
        "url": "/users",
        "request": {
          "body": {
            "name": "string"
          }
        },
        "response": {
          "data!": {
            "user!": "User"
          }
        }
    }
  ]
}
```

### Fetcher
command options: `-fetcher` `-f`

Customize the fetcher you wish to use in the generated file. React-Query is agnostic to the data-fetching layer, so you should provide it, or use a custom one.

The following options are available to use:

- `file#identifier` You can use custom fetcher method that should implement the exported ReactQueryFetcher interface. Example: `./fetcher#apiFetcher`.

```ts
interface FetcherOptions {
  url: string
  method: string
  query?: Record<string, unknown>
  body?: Record<string, unknown> | Record<string, unknown>[]
}

export async function apiFetcher<T = any>(options: FetcherOptions) {
  const response = await fetch(options.url, {method: options.method})
  const result = await response.json()
  return result as T
}
```

### Output directory
command options: `-output-directory` `-o`

For generated files.

Naming like `{schema directory}/sample.json` -> `{output directory}/sample.generated.ts`

## Quick Start

```bash
pnpm add @rest-api-codegen/react-query -D
pnpm add @tanstack/react-query

```

Create sample json in scheme directory, [content like here](#schema-directory)

Create fetcher, [content like here](#fetcher)

```bash
npx @rest-api-codegen/react-query -s ./src/samples -o ./src/samples/generated -f ./utils/fetcher#apiFetcher
```

```tsx
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { useGetUsersQuery, useCreateUserMutation } from './samples/sample.generated.ts'

const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>
  )
}

function Users() {
  // Queries
  const { data } = useGetUsersQuery({ query: { limit: 20, offset: 0 } })

  // Mutations
  const mutation = useCreateUserMutation()

  return (
    <div>
      <ul>{data.users?.map((user) => <li key={user.id}>{user.name}</li>)}</ul>

      <button
        onClick={() => {
          mutation.mutate({
            name: 'Do Laundry',
          })
        }}
      >
        Add User
      </button>
    </div>
  )
}
```
