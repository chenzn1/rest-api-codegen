import { ReactQueryGenerator } from "../src";
import path from 'path'

new ReactQueryGenerator({
  config: path.join(__dirname, 'api.json'),
  fetcher: './utils/fetcher#apiFetcher',
  output: path.join(__dirname,  'api.generated.ts'),
})

setTimeout(() => {
  console.log('end')
}, 10000)