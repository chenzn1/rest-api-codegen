import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import path from 'path'
import { lstat, mkdir, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { VueQueryGenerator } from './generator'
import { OpenApiVueQueryGenerator } from './openapi-generator'

const argv = yargs(hideBin(process.argv))
  .option('schema-dir', {
    alias: 's',
    type: 'string',
    description: 'schema directory',
  })
  .option('fetcher', {
    alias: 'f',
    type: 'string',
    description: 'fetcher',
  })
  .option('output-dir', {
    alias: 'o',
    type: 'string',
    description: 'output directory',
  })
  .parse() as {schemaDir: string, fetcher: string, outputDir: string}

  if (!argv.schemaDir) {
    console.log('Please input schema directory!')
    process.exit(0) 
  }

  if (!argv.fetcher) {
    console.log('Please input fetcher file!')
    process.exit(0) 
  }

  if (!argv.outputDir) {
    console.log('Please input output file!')
    process.exit(0) 
  }


(async () => {
  if (!existsSync(path.join(process.cwd(), argv.schemaDir))) {
    console.log('Schema directory no exists!')
    return
  }

  const schemaStat = await lstat(path.join(process.cwd(), argv.schemaDir))
  if (!schemaStat.isDirectory()) {
    console.log('Schema not a directory!')
    return
  }

  if (!existsSync(path.join(process.cwd(), argv.outputDir))) {
    await mkdir(path.join(process.cwd(), argv.outputDir))
  } else {
    const outputStat = await lstat(path.join(process.cwd(), argv.outputDir))
    if (!outputStat.isDirectory()) {
      console.log('Output not a directory!')
      return
    }
  }
  const fileNames = await readdir(path.join(process.cwd(), argv.schemaDir))
  for (const fileName of fileNames) {
    if (!fileName.endsWith('.json') && !fileName.endsWith('.yaml')) {
      continue
    }
    const stat = await lstat(path.join(process.cwd(), argv.schemaDir, fileName))
    if (stat.isDirectory()) {
      continue
    }
    if (fileName.endsWith('.json') ) {
      await new VueQueryGenerator({
        schema: path.join(process.cwd(), argv.schemaDir, fileName),
        fetcher: argv.fetcher,
        output: path.join(process.cwd(), argv.outputDir, fileName.replace('.json', '.generated.ts')),
      }).run()
    } else {
      
      await new OpenApiVueQueryGenerator({
        schema: path.join(process.cwd(), argv.schemaDir, fileName),
        fetcher: argv.fetcher,
        output: path.join(process.cwd(), argv.outputDir, fileName.replace('.yaml', '.generated.ts')),
        name: fileName.replace('.yaml', '')
      }).run()
    }
  }
})()