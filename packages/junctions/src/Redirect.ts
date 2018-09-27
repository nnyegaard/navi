import { parseLocationString, Location } from './Location'
import { Resolution, Resolvable } from './Resolver'
import { RouteType, RedirectRoute, RouteStatus } from './Route'
import {
  NodeMatcher,
  NodeMatcherResult,
  NodeBase,
  NodeMatcherOptions,
} from './Node'
import { RouterEnv } from './RouterEnv'

export interface Redirect<Meta = any, Context = any>
  extends NodeBase<Context, RedirectMatcher<Meta, Context>> {
  type: RouteType.Redirect

  new (options: NodeMatcherOptions<Context>): RedirectMatcher<Meta>

  to: ((location: Location, env: RouterEnv<Context>) => Location | string)
  meta: Meta
}

export class RedirectMatcher<Meta = any, Context = any> extends NodeMatcher<
  Context
> {
  static isNode = true
  static type: RouteType.Redirect = RouteType.Redirect

  resolvableTo: Resolvable<Location | string>

  last?: {
    resolution: Resolution<Location | string>
    route: RedirectRoute<Meta>
  };

  ['constructor']: Redirect

  constructor(options: NodeMatcherOptions<Context>) {
    super(options)

    if (typeof this.constructor.to !== 'function') {
      let toFn = this.constructor.to
      this.resolvableTo = () => toFn
    } else {
      let toFn = this.constructor.to
      this.resolvableTo = (env: RouterEnv<Context>) =>
        toFn(this.match!.matchedLocation, env)
    }
  }

  protected execute(): NodeMatcherResult<RedirectRoute<Meta>> {
    if (
      !this.match ||
      (this.match.remainingLocation &&
        this.match.remainingLocation.pathname !== '/')
    ) {
      return {}
    }

    let resolution = this.resolver.resolve(this, this.resolvableTo)
    if (!this.last || this.last.resolution !== resolution) {
      let { value, status, error } = resolution

      // Only create a new route if necessary, to allow for reference-equality
      // based comparisons on routes
      this.last = {
        resolution,
        route: this.createRoute(RouteType.Redirect, {
          to: typeof value === 'string' ? parseLocationString(value) : value,
          status: status as string as RouteStatus,
          error,
          remainingRoutes: [],
        }),
      }
    }

    return {
      route: this.last.route,
      resolutionIds: [resolution.id],
    }
  }
}

export function createRedirect<Meta = any, Context = any>(
  to:
    | Location
    | string
    | ((location: Location, env: RouterEnv<Context>) => Location | string),
  meta?: Meta,
): Redirect {
  return class extends RedirectMatcher<Meta, Context> {
    static to = typeof to === 'function' ? to : () => to
    static useParams = []
    static meta = meta
  }
}
