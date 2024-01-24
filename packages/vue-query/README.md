# REST API Code Generator For Vue Query
Based on OpenAPI

## Installation

```bash
// npm
npm install @rest-api-codegen/vue-query --save-dev

// yarn
yarn add @rest-api-codegen/vue-query -D

// pnpm
pnpm add @rest-api-codegen/vue-query -D
```

## Configuration

### Schema directory
command options: `-schema-directory` `-s`

Generator will automatically scan all json files in schema directory.

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
pnpm add @rest-api-codegen/vue-query -D
pnpm add @tanstack/vue-query

```

Create fetcher, [content like here](#fetcher)

```bash
npx @rest-api-codegen/vue-query -s ./src/samples -o ./src/samples/generated -f ./utils/fetcher#apiFetcher
```

```vue
<script setup>
  import { useQueryClient } from '@tanstack/vue-query'
  import { useGetUsersQuery, useCreateUserMutation } from './samples/sample.generated.ts'

  const queryClient = useQueryClient()

  // Queries
  const { data, isPending, isError, error } = useGetUsersQuery({ query: { limit: 20, offset: 0 } })

  // Mutations
  const mutation = useCreateUserMutation({
    onSuccess: () => {
    },
  })
  function onButtonClick() {
    mutation.mutate({
      id: Date.now(),
      title: 'Do Laundry',
    })
  }
</script>

<template>
  <span v-if="isPending">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <!-- We can assume by this point that `isSuccess === true` -->
  <ul v-else>
    <li v-for="user in data.users" :key="user.id">{{ user.name }}</li>
  </ul>
  <button @click="onButtonClick">Add User</button>
</template>
```
