import { joinPaths, URLDescriptor, createURLDescriptor } from './URLTools'
import { NotFoundError } from './Errors'
import { NaviRequest } from './NaviRequest'

/**
 * A type that covers all Chunk objects.
 */
export type Chunk =
  | BusyChunk
  | DataChunk
  | ErrorChunk
  | HeadChunk
  | HeadersChunk
  | MountChunk
  | RedirectChunk
  | StatusChunk
  | TitleChunk
  | URLChunk
  | ViewChunk

export type ChunkType =
  | 'busy'
  | 'data'
  | 'head'
  | 'headers'
  | 'error'
  | 'mount'
  | 'redirect'
  | 'status'
  | 'title'
  | 'url'
  | 'view'

/**
 * All chunks extend this interface. It includes all information that can be
 * inferred from just a pattern string and a location.
 */
export interface GenericChunk {
  type: ChunkType

  /**
   * The part of the URL pathname that has been matched.
   */
  url: URLDescriptor

  error?: any
  to?: any
  view?: any
  map?: any
}


/**
 * This is used in place of a chunk of another type whose final result is
 * not yet known.
 */
export interface BusyChunk extends GenericChunk {
  type: 'busy'
  promise: PromiseLike<any>
}

/**
 * Data chunks contain information that will be available on the produced
 * route object, but isn't meant to be rendered with the page itself.
 */
export interface DataChunk<Data=any> extends GenericChunk {
  type: 'data'
  data: Data
}

/**
 * When encountered in a route by a `<NavView>`, this will be thrown, and
 * can then be handled by an Error Boundary. Behavior for handling error
 * chunks on the server side is undefined.
 */
export interface ErrorChunk extends GenericChunk {
  type: 'error'
  error: any
}

/**
 * Can be used to specify data for your page's <head> separately from
 * the view content.
 */
export interface HeadChunk extends GenericChunk {
  type: 'head'
  head: any
}

/**
 * Used to specify any headers for your HTTP response.
 */
export interface HeadersChunk extends GenericChunk {
  type: 'headers'
  headers: { [name: string]: string }
}

/**
 * Mount chunks are added for each mount that is routed through. They're
 * useful for building site maps, as they hold metadata on other possible
 * paths.
 */
export interface MountChunk extends GenericChunk {
  type: 'mount'
  patterns: string[]
}

/**
 * When added to a route, indicates that the client should follow the redirect
 * to the given address.
 */
export interface RedirectChunk extends GenericChunk {
  type: 'redirect'
  to: string
}

/**
 * Used to specify the status of your HTTP response.
 */
export interface StatusChunk extends GenericChunk {
  type: 'status'
  status: number
}

/**
 * Allows matchers to specify a <title> tag, or document title.
 */
export interface TitleChunk extends GenericChunk {
  type: 'title'
  title: string
}

/**
 * Contains the full URL that should be used for the route, including any hash.
 */
export interface URLChunk extends GenericChunk {
  type: 'url'
}

/**
 * View chunks contain data that will be used in a response on the
 * server, or that will be rendered in the browser. They can contain error
 * or redirect information, but they'll still be rendered as-is in the client.
 */
export interface ViewChunk<View=any> extends GenericChunk {
  type: 'view'
  view: View
}


export function createChunk<Type extends string, Details>(
  type: Type,
  request: NaviRequest,
  details?: Details,
  ensureTrailingSlash = true,
) {
  return Object.assign({
    type: type,
    url: createURLDescriptor({
      pathname: request.mountpath,
      query: request.query,
    }, { ensureTrailingSlash }),
  }, details)
}

export function createNotFoundChunk(request: NaviRequest): ErrorChunk {
  let fullPathname = joinPaths(request.mountpath, request.path)
  return {
    type: 'error',
    url: createURLDescriptor({
      pathname: fullPathname,
      query: request.query,
    }),
    error: new NotFoundError(fullPathname),
  }
}
