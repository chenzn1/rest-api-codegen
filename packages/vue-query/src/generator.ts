import {writeFile, readFile} from 'fs/promises'
interface Api {
  name: string
  method?: string
  url: string
  request?: {
    query?: Record<string, unknown>
    ['query!']? : Record<string, unknown>
    path?: Record<string, string | number>
    ['path!']? : Record<string, string | number>
    body?: Record<string, unknown> | Record<string, unknown>[]
    ['body!']?: Record<string, unknown> | Record<string, unknown>[]

  }
  response: any
}

interface FetcherOptions {
  url: string
  method: string
  query?: Record<string, unknown>
  body?: Record<string, unknown> | Record<string, unknown>[]
}

interface ReactQueryGeneratorOptions {
  schema: string
  fetcher: string
  output: string
}

interface GenQueryOptions {
  url: string;
  method?: string;
  requestInterfaceName?: string;
  responseInterfaceName: string;
}

function upperFirst(str: string) {
  return `${str[0].toLocaleUpperCase()}${str.slice(1)}`
}

export class VueQueryGenerator {
  private schema: string
  private fetcher: string
  private apis: Api[] =[]
  private types: Record<string, any> = {}
  private output: string

  constructor({ schema, fetcher, output }: ReactQueryGeneratorOptions) {
    this.schema = schema;
    this.fetcher = fetcher;
    this.output = output
  }
  private async loadConfig() {
    const contents = await readFile(this.schema, 'utf-8')
    const schema = JSON.parse(contents)
    this.apis = schema.apis
    this.types = schema.types
  }
  async run() {
    await this.loadConfig()
    if (!this.apis.length) {
      return ''
    }
    const contents: string[] = []

    const [fetcherPath, fetcherFunc] = this.fetcher.split('#')
    contents.push('import * as vueQuery from "@tanstack/vue-query";')
    contents.push(`import ${fetcherFunc? `{ ${fetcherFunc} as fetcher }`: 'default as fetcher'} from "${fetcherPath}";`)

    contents.push(...this.genTypes())
    contents.push(`
      function getUrl(url: string, path?: Record<string, string | number>) {
        if (!path) {
          return url
        }
        let nUrl = url 
        for(const field in path) {
          nUrl = nUrl.replace(\`:\${field}\`, \`\${path[field]}\`)
        }
        return nUrl
      }
    `)
    for (const api of this.apis) {
      const requestInterface = api.request? this.genInterface({
        [api.request.query? 'query': 'query!']: api.request.query || api.request['query!'] || 'undefined',
        [api.request.body? 'body': 'body!']: api.request.body || api.request['body!'] || 'undefined',
        [api.request.path? 'path': 'path!']: api.request.path  || api.request['path!'] || 'undefined',
      }): undefined
      const responseInterface = api.response? this.genInterface(api.response): undefined
      let requestInterfaceName: string | undefined
      let responseInterfaceName: string = 'any'
      if (requestInterface) {
        requestInterfaceName = `${upperFirst(api.name)}Request`
        contents.push(`export interface ${requestInterfaceName} ${requestInterface}`)
      }
      if (requestInterface) {
        responseInterfaceName = `${upperFirst(api.name)}Response`
        contents.push(`export interface ${responseInterfaceName} ${responseInterface}`)
      }
      if (!api.method || api.method.toLocaleLowerCase() === 'get') {
        contents.push(this.genQuery(api.name, {
          url: api.url,
          method: api.method,
          requestInterfaceName,
          responseInterfaceName,
        }))
      } else {
        contents.push(this.genMutation(api.name, {
          url: api.url,
          method: api.method,
          requestInterfaceName,
          responseInterfaceName,
        }))
      }
    }
    await writeFile(this.output, contents.join('\n'))
  }
  genTypes() {
    const types: string[] = []
    for(const key in this.types) {
      types.push(`interface ${key} ${this.genInterface(this.types[key])}`)
    }
    return types
  }
  genInterface(schema: Record<string, any> | Record<string, any>[] | string | string[]) {
    let tSchema = Array.isArray(schema)? schema[0]: schema
    if (!tSchema) {
      return 
    }
    if (typeof tSchema === 'string') {
      return `${tSchema}${Array.isArray(schema)? '[]': ''}`
    }
    const types: string[] = []
    for(const key in tSchema) {
      const isRequired = key.endsWith('!');
      const field = isRequired? key.replace('!', ''): `${key}?`;
      if (typeof tSchema[key] !== 'string') {
        types.push(`${field}: ${this.genInterface(tSchema[key])}`)
      } else {
        types.push(`${field}: ${tSchema[key]}`)
      }
    }
    return `{\n ${types.join('\n')} \n}${Array.isArray(schema)? '[]': ''}`
  }
  genQuery(name: string, options: GenQueryOptions){
    return `export function use${upperFirst(name)}Query(${options.requestInterfaceName? `request: ${options.requestInterfaceName},`: ''}options: vueQuery.QueryOptions<${options.responseInterfaceName}>) {
      return vueQuery.useQuery<${options.responseInterfaceName}>({
        queryKey: ["${name}", JSON.stringify(request)],
        queryFn: () => fetcher<${options.responseInterfaceName}>({
          method: "${options.method}",
          ${options.requestInterfaceName? `
            url: getUrl("${options.url}", request.path),
            query: request.query,
            body: request.body,
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
            url: getUrl("${options.url}", request.path),
            query: request.query,
            body: request.body,
          `: `url: "${options.url}"`}
        }),
        ...options,
      });
    }`
  }
}