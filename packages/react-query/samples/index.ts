import { ReactQueryGenerator } from "../src/generator";
import path from 'path'

new ReactQueryGenerator({
  schema: path.join(__dirname, 'api.json'),
  fetcher: './utils/fetcher#apiFetcher',
  output: path.join(__dirname,  'api.generated.ts'),
})
