import {writeFile, readFile} from 'fs/promises'
import YAML from 'yaml'
import openapiTS from 'openapi-typescript'
import {isEmpty, find} from 'lodash'


interface Api {
  name: string
  method?: string
  url: string
  parameters?: any
  requestBody?: any
  response?: any
}

interface OpenApiVueQueryGeneratorOptions {
  schema: string
  fetcher: string
  output: string
  name: string
}

interface GenQueryOptions {
  url: string;
  method?: string;
  requestInterfaceName?: string;
  hasQuery?: boolean
  hasBody?: boolean
  hasPath?: boolean
  responseInterfaceName: string;
}

function upperFirst(str: string) {
  return `${str[0].toLocaleUpperCase()}${str.slice(1)}`
}

export class OpenApiVueQueryGenerator {
  private schema: string
  private fetcher: string
  private apis: Api[] =[]
  private output: string
  private name: string

  constructor({ schema, fetcher, output, name }: OpenApiVueQueryGeneratorOptions) {
    this.schema = schema;
    this.fetcher = fetcher;
    this.output = output
    this.name = name
  }
  private async loadConfig() {
    const content = await readFile(this.schema, 'utf-8')
    const schema = YAML.parse(content)
    this.apis = Object.entries(schema.paths).flatMap(([url, requests]) => {
      const apis = Object.entries(requests as any).map(([method, apiOptions]: [string, any]) => {
        return {
          url,
          method,
          name: apiOptions.operationId,
          parameters: apiOptions.parameters,
          requestBody: apiOptions.requestBody,
          response: apiOptions.responses['200']?.content
        }
      }) 
      return apis
    })
  }
  async run() {
    await this.loadConfig()
    if (!this.apis.length) {
      return ''
    }

    const schemaTypeContent = await openapiTS(this.schema)
    await writeFile(this.output.replace('generated.ts', 'typed.ts'), schemaTypeContent)

    const contents: string[] = []

    const [fetcherPath, fetcherFunc] = this.fetcher.split('#')
    contents.push(`import {operations, components} from "./${this.name}.typed";`)
    contents.push('import * as vueQuery from "@tanstack/vue-query";')
    contents.push(`import ${fetcherFunc? `{ ${fetcherFunc} as fetcher }`: 'default as fetcher'} from "${fetcherPath}";`)

    contents.push(`type Values<T> = T[keyof T]`)

    contents.push(`
      function getUrl(url: string, path?: Record<string, string | number>) {
        if (!path) {
          return url
        }
        let nUrl = url 
        for(const field in path) {
          nUrl = nUrl.replace(\`:\${field}\`, \`\${path[field]}\`).replace(\`{\${field}}\`, \`\${path[field]}\`)
        }
        return nUrl
      }
    `)
    for (const api of this.apis) {
      let requestInterfaceName: string | undefined
      const hasBody =  !isEmpty(api.requestBody)
      if (api.parameters?.length && !hasBody) {
        requestInterfaceName = `operations['${api.name}']['parameters']`
      } else if (api.parameters?.length && hasBody) {
        requestInterfaceName = `operations['${api.name}']['parameters'] & { body${api.requestBody.required? '': '?'}: Values<operations['${api.name}']['requestBody']['content']> }`
      } else if (!api.parameters?.length && hasBody) {
        requestInterfaceName = `{ body${api.requestBody.required? '': '?'}: Values<operations['${api.name}']['requestBody']['content']> }`
      }  
      let responseInterfaceName: string = api.response? `Values<operations['${api.name}']['responses'][200]['content']>`: 'any'
      if (!api.method || api.method.toLocaleLowerCase() === 'get') {
        contents.push(this.genQuery(api.name, {
          url: api.url,
          method: api.method,
          requestInterfaceName,
          responseInterfaceName,
          hasBody,
          hasQuery: Boolean(find(api.parameters, ['in', 'query'])),
          hasPath: Boolean(find(api.parameters, ['in', 'path'])),
        }))
      } else {
        contents.push(this.genMutation(api.name, {
          url: api.url,
          method: api.method,
          requestInterfaceName,
          responseInterfaceName,
          hasBody,
          hasQuery: Boolean(find(api.parameters, ['in', 'query'])),
          hasPath: Boolean(find(api.parameters, ['in', 'path'])),
        }))
      }
    }
    await writeFile(this.output, contents.join('\n'))
  }

  genQuery(name: string, options: GenQueryOptions){
    return `export function use${upperFirst(name)}Query(${options.requestInterfaceName? `request: ${options.requestInterfaceName},`: ''}options: vueQuery.QueryOptions<${options.responseInterfaceName}>) {
      return vueQuery.useQuery<${options.responseInterfaceName}>({
        queryKey: ${options.requestInterfaceName? `["${name}", JSON.stringify(request)]`: `["${name}"]`},
        queryFn: () => fetcher<${options.responseInterfaceName}>({
          method: "${options.method}",
          ${options.requestInterfaceName? `
            url: ${options.hasPath? `getUrl("${options.url}", request.path)`: `"${options.url}"`},
            ${options.hasQuery? 'query: request.query,': ''}
            ${options.hasBody? 'body: request.body,': ''}
          `: `url: "${options.url}"`}
          
        }),
        ...options,
      });
    }`
  }
  genMutation(name: string, options: GenQueryOptions) {
    return `export function use${upperFirst(name)}Mutation(${options.requestInterfaceName? `request: ${options.requestInterfaceName},`: ''}options: vueQuery.MutationOptions<${options.responseInterfaceName}>) {
      return vueQuery.useMutation<${options.responseInterfaceName}>({
        mutationKey: ["${name}"],
        mutationFn: () => fetcher<${options.responseInterfaceName}>({
          method: "${options.method}",
          ${options.requestInterfaceName? `
            url: ${options.hasPath? `getUrl("${options.url}", request.path)`: `"${options.url}"`},
            ${options.hasQuery? 'query: request.query,': ''}
            ${options.hasBody? 'body: request.body,': ''}
          `: `url: "${options.url}"`}
        }),
        ...options,
      });
    }`
  }
}