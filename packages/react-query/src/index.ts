import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import { ReactQueryGenerator } from './generator'
import path from 'path'

const argv = yargs(hideBin(process.argv))
  .option('schema', {
    alias: 's',
    type: 'string',
    description: 'schema file',
  })
  .option('fetcher', {
    alias: 'f',
    type: 'string',
    description: 'fetcher',
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'output file',
  })
  .parse() as {schema: string, fetcher: string, output: string}


  if (!argv.schema) {
    console.log('Please input schema file!')
    process.exit(0) 
  }

  if (!argv.fetcher) {
    console.log('Please input fetcher file!')
    process.exit(0) 
  }

  if (!argv.output) {
    console.log('Please input output file!')
    process.exit(0) 
  }


(async () => {
  await new ReactQueryGenerator({
    schema: path.join(process.cwd(), argv.schema),
    fetcher: argv.fetcher,
    output: path.join(process.cwd(), argv.output),
  }).run()
})()