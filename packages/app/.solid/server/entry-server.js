import { renderToStringAsync, isServer, createComponent, mergeProps, ssr, ssrHydrationKey, ssrSpread, ssrAttribute, escape, Assets, HydrationScript, NoHydration, ssrStyle, Dynamic } from 'solid-js/web';
import { createContext, createSignal, onMount, onCleanup, runWithOwner, createMemo, getOwner, useContext, createComponent as createComponent$1, useTransition, on, untrack, resetErrorBoundaries, createRenderEffect, children, createRoot, Show, splitProps, lazy, ErrorBoundary as ErrorBoundary$1, createEffect, For, Switch, Match, Suspense, sharedConfig, createResource } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import 'jszip';
import 'magic-bytes.js';
import 'canvas-confetti';

function renderAsync(fn, options) {
  return () => async (context) => {
    let markup = await renderToStringAsync(() => fn(context), options);
    if (context.routerContext.url) {
      return Response.redirect(new URL(context.routerContext.url, context.request.url), 302);
    }
    context.responseHeaders.set("Content-Type", "text/html");
    return new Response(markup, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}

const MetaContext = createContext();
const cascadingTags = ["title", "meta"];

const MetaProvider = props => {
  const indices = new Map(),
        [tags, setTags] = createSignal({});
  onMount(() => {
    const ssrTags = document.head.querySelectorAll(`[data-sm=""]`); // `forEach` on `NodeList` is not supported in Googlebot, so use a workaround

    Array.prototype.forEach.call(ssrTags, ssrTag => ssrTag.parentNode.removeChild(ssrTag));
  });
  const actions = {
    addClientTag: (tag, name) => {
      // consider only cascading tags
      if (cascadingTags.indexOf(tag) !== -1) {
        setTags(tags => {
          const names = tags[tag] || [];
          return { ...tags,
            [tag]: [...names, name]
          };
        }); // track indices synchronously

        const index = indices.has(tag) ? indices.get(tag) + 1 : 0;
        indices.set(tag, index);
        return index;
      }

      return -1;
    },
    shouldRenderTag: (tag, index) => {
      if (cascadingTags.indexOf(tag) !== -1) {
        const names = tags()[tag]; // check if the tag is the last one of similar

        return names && names.lastIndexOf(names[index]) === index;
      }

      return true;
    },
    removeClientTag: (tag, index) => {
      setTags(tags => {
        const names = tags[tag];

        if (names) {
          names[index] = null;
          return { ...tags,
            [tag]: names
          };
        }

        return tags;
      });
    }
  };

  if (isServer) {
    actions.addServerTag = tagDesc => {
      const {
        tags = []
      } = props; // tweak only cascading tags

      if (cascadingTags.indexOf(tagDesc.tag) !== -1) {
        const index = tags.findIndex(prev => {
          const prevName = prev.props.name || prev.props.property;
          const nextName = tagDesc.props.name || tagDesc.props.property;
          return prev.tag === tagDesc.tag && prevName === nextName;
        });

        if (index !== -1) {
          tags.splice(index, 1);
        }
      }

      tags.push(tagDesc);
    };

    if (Array.isArray(props.tags) === false) {
      throw Error("tags array should be passed to <MetaProvider /> in node");
    }
  }

  return createComponent(MetaContext.Provider, {
    value: actions,

    get children() {
      return props.children;
    }

  });
};
function renderTags(tags) {
  return tags.map(tag => {
    const keys = Object.keys(tag.props);
    const props = keys.map(k => k === "children" ? "" : ` ${k}="${tag.props[k]}"`).join("");
    return tag.props.children ? `<${tag.tag} data-sm=""${props}>${// Tags might contain multiple text children:
    //   <Title>example - {myCompany}</Title>
    Array.isArray(tag.props.children) ? tag.props.children.join("") : tag.props.children}</${tag.tag}>` : `<${tag.tag} data-sm=""${props}/>`;
  }).join("");
}

function bindEvent(target, type, handler) {
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
}
function intercept([value, setValue], get, set) {
    return [get ? () => get(value()) : value, set ? (v) => setValue(set(v)) : setValue];
}
function querySelector(selector) {
    // Guard against selector being an invalid CSS selector
    try {
        return document.querySelector(selector);
    }
    catch (e) {
        return null;
    }
}
function scrollToHash(hash, fallbackTop) {
    const el = querySelector(`#${hash}`);
    if (el) {
        el.scrollIntoView();
    }
    else if (fallbackTop) {
        window.scrollTo(0, 0);
    }
}
function createIntegration(get, set, init, utils) {
    let ignore = false;
    const wrap = (value) => (typeof value === "string" ? { value } : value);
    const signal = intercept(createSignal(wrap(get()), { equals: (a, b) => a.value === b.value }), undefined, next => {
        !ignore && set(next);
        return next;
    });
    init &&
        onCleanup(init((value = get()) => {
            ignore = true;
            signal[1](wrap(value));
            ignore = false;
        }));
    return {
        signal,
        utils
    };
}
function normalizeIntegration(integration) {
    if (!integration) {
        return {
            signal: createSignal({ value: "" })
        };
    }
    else if (Array.isArray(integration)) {
        return {
            signal: integration
        };
    }
    return integration;
}
function staticIntegration(obj) {
    return {
        signal: [() => obj, next => Object.assign(obj, next)]
    };
}
function pathIntegration() {
    return createIntegration(() => ({
        value: window.location.pathname + window.location.search + window.location.hash,
        state: history.state
    }), ({ value, replace, scroll, state }) => {
        if (replace) {
            window.history.replaceState(state, "", value);
        }
        else {
            window.history.pushState(state, "", value);
        }
        scrollToHash(window.location.hash.slice(1), scroll);
    }, notify => bindEvent(window, "popstate", () => notify()), {
        go: delta => window.history.go(delta)
    });
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|\/+$/g;
function normalize(path, omitSlash = false) {
    const s = path.replace(trimPathRegex, "");
    return s ? (omitSlash || /^[?#]/.test(s) ? s : "/" + s) : "";
}
function resolvePath(base, path, from) {
    if (hasSchemeRegex.test(path)) {
        return undefined;
    }
    const basePath = normalize(base);
    const fromPath = from && normalize(from);
    let result = "";
    if (!fromPath || path.startsWith("/")) {
        result = basePath;
    }
    else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
        result = basePath + fromPath;
    }
    else {
        result = fromPath;
    }
    return (result || "/") + normalize(path, !result);
}
function invariant(value, message) {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}
function joinPaths(from, to) {
    return normalize(from).replace(/\/*(\*.*)?$/g, "") + normalize(to);
}
function extractSearchParams(url) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
function urlDecode(str, isQuery) {
    return decodeURIComponent(isQuery ? str.replace(/\+/g, " ") : str);
}
function createMatcher(path, partial) {
    const [pattern, splat] = path.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    const len = segments.length;
    return (location) => {
        const locSegments = location.split("/").filter(Boolean);
        const lenDiff = locSegments.length - len;
        if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
            return null;
        }
        const match = {
            path: len ? "" : "/",
            params: {}
        };
        for (let i = 0; i < len; i++) {
            const segment = segments[i];
            const locSegment = locSegments[i];
            if (segment[0] === ":") {
                match.params[segment.slice(1)] = locSegment;
            }
            else if (segment.localeCompare(locSegment, undefined, { sensitivity: "base" }) !== 0) {
                return null;
            }
            match.path += `/${locSegment}`;
        }
        if (splat) {
            match.params[splat] = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
        }
        return match;
    };
}
function scoreRoute(route) {
    const [pattern, splat] = route.pattern.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === undefined ? 0 : 1));
}
function createMemoObject(fn) {
    const map = new Map();
    const owner = getOwner();
    return new Proxy({}, {
        get(_, property) {
            if (!map.has(property)) {
                runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
            }
            return map.get(property)();
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true
            };
        },
        ownKeys() {
            return Reflect.ownKeys(fn());
        }
    });
}
function expandOptionals(pattern) {
    let match = /(\/?\:[^\/]+)\?/.exec(pattern);
    if (!match)
        return [pattern];
    let prefix = pattern.slice(0, match.index);
    let suffix = pattern.slice(match.index + match[0].length);
    const prefixes = [prefix, (prefix += match[1])];
    // This section handles adjacent optional params. We don't actually want all permuations since
    // that will lead to equivalent routes which have the same number of params. For example
    // `/:a?/:b?/:c`? only has the unique expansion: `/`, `/:a`, `/:a/:b`, `/:a/:b/:c` and we can
    // discard `/:b`, `/:c`, `/:b/:c` by building them up in order and not recursing. This also helps
    // ensure predictability where earlier params have precidence.
    while ((match = /^(\/\:[^\/]+)\?/.exec(suffix))) {
        prefixes.push((prefix += match[1]));
        suffix = suffix.slice(match[0].length);
    }
    return expandOptionals(suffix).reduce((results, expansion) => [...results, ...prefixes.map(p => p + expansion)], []);
}

const MAX_REDIRECTS = 100;
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
let TempRoute;
const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
const useResolvedPath = (path) => {
    const route = useRoute();
    return createMemo(() => route.resolvePath(path()));
};
const useHref = (to) => {
    const router = useRouter();
    return createMemo(() => {
        const to_ = to();
        return to_ !== undefined ? router.renderPath(to_) : to_;
    });
};
const useLocation = () => useRouter().location;
const useMatch = (path) => {
    const location = useLocation();
    const matcher = createMemo(() => createMatcher(path()));
    return createMemo(() => matcher()(location.pathname));
};
function createRoutes(routeDef, base = "", fallback) {
    const { component, data, children } = routeDef;
    const isLeaf = !children || (Array.isArray(children) && !children.length);
    const shared = {
        key: routeDef,
        element: component
            ? () => createComponent$1(component, {})
            : () => {
                const { element } = routeDef;
                return element === undefined && fallback
                    ? createComponent$1(fallback, {})
                    : element;
            },
        preload: routeDef.component
            ? component.preload
            : routeDef.preload,
        data
    };
    return asArray(routeDef.path).reduce((acc, path) => {
        for (const originalPath of expandOptionals(path)) {
            const path = joinPaths(base, originalPath);
            const pattern = isLeaf ? path : path.split("/*", 1)[0];
            acc.push({
                ...shared,
                originalPath,
                pattern,
                matcher: createMatcher(pattern, !isLeaf)
            });
        }
        return acc;
    }, []);
}
function createBranch(routes, index = 0) {
    return {
        routes,
        score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
        matcher(location) {
            const matches = [];
            for (let i = routes.length - 1; i >= 0; i--) {
                const route = routes[i];
                const match = route.matcher(location);
                if (!match) {
                    return null;
                }
                matches.unshift({
                    ...match,
                    route
                });
            }
            return matches;
        }
    };
}
function asArray(value) {
    return Array.isArray(value) ? value : [value];
}
function createBranches(routeDef, base = "", fallback, stack = [], branches = []) {
    const routeDefs = asArray(routeDef);
    for (let i = 0, len = routeDefs.length; i < len; i++) {
        const def = routeDefs[i];
        if (def && typeof def === "object" && def.hasOwnProperty("path")) {
            const routes = createRoutes(def, base, fallback);
            for (const route of routes) {
                stack.push(route);
                if (def.children) {
                    createBranches(def.children, route.pattern, fallback, stack, branches);
                }
                else {
                    const branch = createBranch([...stack], branches.length);
                    branches.push(branch);
                }
                stack.pop();
            }
        }
    }
    // Stack will be empty on final return
    return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches$1(branches, location) {
    for (let i = 0, len = branches.length; i < len; i++) {
        const match = branches[i].matcher(location);
        if (match) {
            return match;
        }
    }
    return [];
}
function createLocation(path, state) {
    const origin = new URL("http://sar");
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin, {
        equals: (a, b) => a.href === b.href
    });
    const pathname = createMemo(() => urlDecode(url().pathname));
    const search = createMemo(() => urlDecode(url().search, true));
    const hash = createMemo(() => urlDecode(url().hash));
    const key = createMemo(() => "");
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: createMemoObject(on(search, () => extractSearchParams(url())))
    };
}
function createRouterContext(integration, base = "", data, out) {
    const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const basePath = resolvePath("", base);
    const output = isServer && out
        ? Object.assign(out, {
            matches: [],
            url: undefined
        })
        : undefined;
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, start] = useTransition();
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state);
    const referrers = [];
    const baseRoute = {
        pattern: basePath,
        params: {},
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    if (data) {
        try {
            TempRoute = baseRoute;
            baseRoute.data = data({
                data: undefined,
                params: {},
                location,
                navigate: navigatorFactory(baseRoute)
            });
        }
        finally {
            TempRoute = undefined;
        }
    }
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) ;
                else if (utils.go) {
                    utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: true,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                if (isServer) {
                    if (output) {
                        output.url = resolvedTo;
                    }
                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
                }
                else {
                    const len = referrers.push({ value: current, replace, scroll, state: state() });
                    start(() => {
                        setReference(resolvedTo);
                        setState(nextState);
                        resetErrorBoundaries();
                    }).then(() => {
                        if (referrers.length === len) {
                            navigateEnd({
                                value: resolvedTo,
                                state: nextState
                            });
                        }
                    });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    function navigateEnd(next) {
        const first = referrers[0];
        if (first) {
            if (next.value !== first.value || next.state !== first.state) {
                setSource({
                    ...next,
                    replace: first.replace,
                    scroll: first.scroll
                });
            }
            referrers.length = 0;
        }
    }
    createRenderEffect(() => {
        const { value, state } = source();
        // Untrack this whole block so `start` doesn't cause Solid's Listener to be preserved
        untrack(() => {
            if (value !== reference()) {
                start(() => {
                    setReference(value);
                    setState(state);
                });
            }
        });
    });
    if (!isServer) {
        function isSvg(el) {
            return el.namespaceURI === "http://www.w3.org/2000/svg";
        }
        function handleAnchorClick(evt) {
            if (evt.defaultPrevented ||
                evt.button !== 0 ||
                evt.metaKey ||
                evt.altKey ||
                evt.ctrlKey ||
                evt.shiftKey)
                return;
            const a = evt
                .composedPath()
                .find(el => el instanceof Node && el.nodeName.toUpperCase() === "A");
            if (!a)
                return;
            const svg = isSvg(a);
            const href = svg ? a.href.baseVal : a.href;
            const target = svg ? a.target.baseVal : a.target;
            if (target || (!href && !a.hasAttribute("state")))
                return;
            const rel = (a.getAttribute("rel") || "").split(/\s+/);
            if (a.hasAttribute("download") || (rel && rel.includes("external")))
                return;
            const url = svg ? new URL(href, document.baseURI) : new URL(href);
            const pathname = urlDecode(url.pathname);
            if (url.origin !== window.location.origin ||
                (basePath && pathname && !pathname.toLowerCase().startsWith(basePath.toLowerCase())))
                return;
            const to = parsePath(pathname + urlDecode(url.search, true) + urlDecode(url.hash));
            const state = a.getAttribute("state");
            evt.preventDefault();
            navigateFromRoute(baseRoute, to, {
                resolve: false,
                replace: a.hasAttribute("replace"),
                scroll: !a.hasAttribute("noscroll"),
                state: state && JSON.parse(state)
            });
        }
        document.addEventListener("click", handleAnchorClick);
        onCleanup(() => document.removeEventListener("click", handleAnchorClick));
    }
    return {
        base: baseRoute,
        out: output,
        location,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory
    };
}
function createRouteContext(router, parent, child, match) {
    const { base, location, navigatorFactory } = router;
    const { pattern, element: outlet, preload, data } = match().route;
    const path = createMemo(() => match().path);
    const params = createMemoObject(() => match().params);
    preload && preload();
    const route = {
        parent,
        pattern,
        get child() {
            return child();
        },
        path,
        params,
        data: parent.data,
        outlet,
        resolvePath(to) {
            return resolvePath(base.path(), to, path());
        }
    };
    if (data) {
        try {
            TempRoute = route;
            route.data = data({ data: parent.data, params, location, navigate: navigatorFactory(route) });
        }
        finally {
            TempRoute = undefined;
        }
    }
    return route;
}

const _tmpl$$k = ["<a", " ", ">", "</a>"];
const Router = props => {
  const {
    source,
    url,
    base,
    data,
    out
  } = props;
  const integration = source || (isServer ? staticIntegration({
    value: url || ""
  }) : pathIntegration());
  const routerState = createRouterContext(integration, base, data, out);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,

    get children() {
      return props.children;
    }

  });
};
const Routes$1 = props => {
  const router = useRouter();
  const parentRoute = useRoute();
  const routeDefs = children(() => props.children);
  const branches = createMemo(() => createBranches(routeDefs(), joinPaths(parentRoute.pattern, props.base || ""), Outlet));
  const matches = createMemo(() => getRouteMatches$1(branches(), router.location.pathname));

  if (router.out) {
    router.out.matches.push(matches().map(({
      route,
      path,
      params
    }) => ({
      originalPath: route.originalPath,
      pattern: route.pattern,
      path,
      params
    })));
  }

  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];

    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];

      if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
        next[i] = prev[i];
      } else {
        equal = false;

        if (disposers[i]) {
          disposers[i]();
        }

        createRoot(dispose => {
          disposers[i] = dispose;
          next[i] = createRouteContext(router, next[i - 1] || parentRoute, () => routeStates()[i + 1], () => matches()[i]);
        });
      }
    }

    disposers.splice(nextMatches.length).forEach(dispose => dispose());

    if (prev && equal) {
      return prev;
    }

    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },

    children: route => createComponent(RouteContextObj.Provider, {
      value: route,

      get children() {
        return route.outlet();
      }

    })
  });
};
const useRoutes = (routes, base) => {
  return () => createComponent(Routes$1, {
    base: base,
    children: routes
  });
};
const Outlet = () => {
  const route = useRoute();
  return createComponent(Show, {
    get when() {
      return route.child;
    },

    children: child => createComponent(RouteContextObj.Provider, {
      value: child,

      get children() {
        return child.outlet();
      }

    })
  });
};

function LinkBase(props) {
  const [, rest] = splitProps(props, ["children", "to", "href", "state"]);
  const href = useHref(() => props.to);
  return ssr(_tmpl$$k, ssrHydrationKey(), ssrSpread(rest, false, true) + ssrAttribute("href", escape(href(), true) || escape(props.href, true), false) + ssrAttribute("state", escape(JSON.stringify(props.state), true), false), escape(props.children));
}

function Link(props) {
  const to = useResolvedPath(() => props.href);
  return createComponent(LinkBase, mergeProps(props, {
    get to() {
      return to();
    }

  }));
}

const StartContext = createContext({});
function StartProvider(props) {
  const [request, setRequest] = createSignal(new Request(isServer ? props.context.request.url : window.location.pathname)); // TODO: throw error if values are used on client for anything more than stubbing
  // OR replace with actual request that updates with the current URL

  return createComponent(StartContext.Provider, {
    get value() {
      return props.context || {
        get request() {
          return request();
        },

        get responseHeaders() {
          return new Headers();
        },

        get tags() {
          return [];
        },

        get manifest() {
          return {};
        },

        get routerContext() {
          return {};
        },

        setStatusCode(code) {},

        setHeader(name, value) {}

      };
    },

    get children() {
      return props.children;
    }

  });
}

const _tmpl$$j = ["<link", " rel=\"stylesheet\"", ">"],
      _tmpl$2$6 = ["<link", " rel=\"modulepreload\"", ">"];

function getAssetsFromManifest(manifest, routerContext) {
  const match = routerContext.matches.reduce((memo, m) => {
    memo.push(...(manifest[mapRouteToFile(m)] || []));
    return memo;
  }, []);
  const links = match.reduce((r, src) => {
    r[src.href] = src.type === "style" ? ssr(_tmpl$$j, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : ssr(_tmpl$2$6, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false));
    return r;
  }, {});
  return Object.values(links);
}

function mapRouteToFile(matches) {
  return matches.map(h => h.originalPath.replace(/:(\w+)/, (f, g) => `[${g}]`).replace(/\*(\w+)/, (f, g) => `[...${g}]`)).join("");
}
/**
 * Links are used to load assets for the server.
 * @returns {JSXElement}
 */


function Links() {
  const context = useContext(StartContext);
  return createComponent(Assets, {
    get children() {
      return getAssetsFromManifest(context.manifest, context.routerContext);
    }

  });
}

function Meta() {
  const context = useContext(StartContext); // @ts-expect-error The ssr() types do not match the Assets child types

  return createComponent(Assets, {
    get children() {
      return ssr(renderTags(context.tags));
    }

  });
}

/// <reference path="../server/types.tsx" />
const routes = [{
  component: lazy(() => Promise.resolve().then(function () { return faviconGenerator$1; })),
  path: "/favicon-generator"
}, {
  component: lazy(() => Promise.resolve().then(function () { return index$7; })),
  path: "/"
}]; // console.log(routes);

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const Routes = useRoutes(routes);

const _tmpl$$i = ["<script", " type=\"module\" async", "></script>"];

function getFromManifest(manifest) {
  const match = manifest["*"];
  const entry = match.find(src => src.type === "script");
  return ssr(_tmpl$$i, ssrHydrationKey(), ssrAttribute("src", escape(entry.href, true), false));
}

function Scripts() {
  const context = useContext(StartContext);
  return [createComponent(HydrationScript, {}), createComponent(NoHydration, {
    get children() {
      return isServer && (getFromManifest(context.manifest));
    }

  })];
}

const _tmpl$$h = ["<div", " style=\"", "\"><div style=\"", "\"><p style=\"", "\" id=\"error-message\">", "</p><button id=\"reset-errors\" style=\"", "\">Clear errors and retry</button><pre style=\"", "\">", "</pre></div></div>"];
function ErrorBoundary(props) {
  return createComponent(ErrorBoundary$1, {
    fallback: e => {
      return createComponent(Show, {
        get when() {
          return !props.fallback;
        },

        get fallback() {
          return props.fallback(e);
        },

        get children() {
          return createComponent(ErrorMessage, {
            error: e
          });
        }

      });
    },

    get children() {
      return props.children;
    }

  });
}

function ErrorMessage(props) {
  return ssr(_tmpl$$h, ssrHydrationKey(), "padding:" + "16px", "background-color:" + "rgba(252, 165, 165)" + (";color:" + "rgb(153, 27, 27)") + (";border-radius:" + "5px") + (";overflow:" + "scroll") + (";padding:" + "16px") + (";margin-bottom:" + "8px"), "font-weight:" + "bold", escape(props.error.message), "color:" + "rgba(252, 165, 165)" + (";background-color:" + "rgb(153, 27, 27)") + (";border-radius:" + "5px") + (";padding:" + "4px 8px"), "margin-top:" + "8px" + (";width:" + "100%"), escape(props.error.stack));
}

var __uno = /* #__PURE__ */ (() => "#--unocss--{layer:__ALL__}")();

var tailwind = /* #__PURE__ */ (() => "/*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: currentColor; /* 2 */\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n")();

var fonts = /* #__PURE__ */ (() => "/* inter-regular - latin */\n@font-face {\n  font-family: 'Inter';\n  font-style: normal;\n  font-weight: 400;\n  src: url('./fonts/inter-v11-latin-regular.eot');\n  /* IE9 Compat Modes */\n  src: local(''),\n    url('./fonts/inter-v11-latin-regular.eot?#iefix') format('embedded-opentype'),\n    \n    url('/assets/inter-v11-latin-regular.d56fec21.woff2') format('woff2'),\n    \n    url('/assets/inter-v11-latin-regular.9ec803ce.woff') format('woff'),\n    \n    url('./fonts/inter-v11-latin-regular.ttf') format('truetype'),\n    \n    url('./fonts/inter-v11-latin-regular.svg#Inter') format('svg');\n  /* Legacy iOS */\n}\n\n/* inter-500 - latin */\n@font-face {\n  font-family: 'Inter';\n  font-style: normal;\n  font-weight: 500;\n  src: url('./fonts/inter-v11-latin-500.eot');\n  /* IE9 Compat Modes */\n  src: local(''),\n    url('./fonts/inter-v11-latin-500.eot?#iefix') format('embedded-opentype'),\n    \n    url('/assets/inter-v11-latin-500.aa5a5a7a.woff2') format('woff2'),\n    \n    url('/assets/inter-v11-latin-500.c8015ce3.woff') format('woff'),\n    \n    url('./fonts/inter-v11-latin-500.ttf') format('truetype'),\n    \n    url('./fonts/inter-v11-latin-500.svg#Inter') format('svg');\n  /* Legacy iOS */\n}\n\n/* inter-600 - latin */\n@font-face {\n  font-family: 'Inter';\n  font-style: normal;\n  font-weight: 600;\n  src: url('./fonts/inter-v11-latin-600.eot');\n  /* IE9 Compat Modes */\n  src: local(''),\n    url('./fonts/inter-v11-latin-600.eot?#iefix') format('embedded-opentype'),\n    \n    url('/assets/inter-v11-latin-600.ff769fa6.woff2') format('woff2'),\n    \n    url('/assets/inter-v11-latin-600.d4339a04.woff') format('woff'),\n    \n    url('./fonts/inter-v11-latin-600.ttf') format('truetype'),\n    \n    url('./fonts/inter-v11-latin-600.svg#Inter') format('svg');\n  /* Legacy iOS */\n}")();

const isFunction = (valOrFunction) => typeof valOrFunction === 'function';
const resolveValue = (valOrFunction, arg) => (isFunction(valOrFunction) ? valOrFunction(arg) : valOrFunction);

var ActionType;
(function (ActionType) {
    ActionType[ActionType["ADD_TOAST"] = 0] = "ADD_TOAST";
    ActionType[ActionType["UPDATE_TOAST"] = 1] = "UPDATE_TOAST";
    ActionType[ActionType["UPSERT_TOAST"] = 2] = "UPSERT_TOAST";
    ActionType[ActionType["DISMISS_TOAST"] = 3] = "DISMISS_TOAST";
    ActionType[ActionType["REMOVE_TOAST"] = 4] = "REMOVE_TOAST";
    ActionType[ActionType["START_PAUSE"] = 5] = "START_PAUSE";
    ActionType[ActionType["END_PAUSE"] = 6] = "END_PAUSE";
})(ActionType || (ActionType = {}));

const [store, setStore] = createStore({
    toasts: [],
    pausedAt: undefined,
});
const createTimers = () => {
    const { pausedAt, toasts } = store;
    if (pausedAt)
        return;
    const now = Date.now();
    const timers = toasts.map(toast => {
        if (toast.duration === Infinity)
            return;
        const durationLeft = (toast.duration || 0) + toast.pauseDuration - (now - toast.createdAt);
        if (durationLeft <= 0) {
            if (toast.visible) {
                dispatch({
                    type: ActionType.DISMISS_TOAST,
                    toastId: toast.id
                });
            }
            return;
        }
        return setTimeout(() => {
            dispatch({
                type: ActionType.DISMISS_TOAST,
                toastId: toast.id
            });
        }, durationLeft);
    });
    return timers;
};
const removalQueue = new Map();
const scheduleRemoval = (toastId, unmountDelay) => {
    if (removalQueue.has(toastId))
        return;
    const timeout = setTimeout(() => {
        removalQueue.delete(toastId);
        dispatch({
            type: ActionType.REMOVE_TOAST,
            toastId
        });
    }, unmountDelay);
    removalQueue.set(toastId, timeout);
};
const unscheduleRemoval = (toastId) => {
    const timeout = removalQueue.get(toastId);
    removalQueue.delete(toastId);
    if (timeout)
        clearTimeout(timeout);
};
const dispatch = (action) => {
    switch (action.type) {
        case ActionType.ADD_TOAST:
            setStore('toasts', t => {
                const toasts = t;
                return [action.toast, ...toasts];
            });
            break;
        case ActionType.DISMISS_TOAST:
            const { toastId } = action;
            const toasts = store.toasts;
            if (toastId) {
                const toastToRemove = toasts.find(t => t.id === toastId);
                if (toastToRemove)
                    scheduleRemoval(toastId, toastToRemove.unmountDelay);
            }
            else {
                toasts.forEach(t => {
                    scheduleRemoval(t.id, t.unmountDelay);
                });
            }
            setStore('toasts', t => t.id === toastId, produce(t => t.visible = false));
            break;
        case ActionType.REMOVE_TOAST:
            if (!action.toastId) {
                setStore('toasts', []);
                break;
            }
            setStore('toasts', t => {
                const toasts = t;
                return toasts.filter(t => t.id !== action.toastId);
            });
            break;
        case ActionType.UPDATE_TOAST:
            if (action.toast.id) {
                unscheduleRemoval(action.toast.id);
            }
            setStore('toasts', t => t.id === action.toast.id, t => {
                const toast = t;
                return {
                    ...toast,
                    ...action.toast,
                };
            });
            break;
        case ActionType.UPSERT_TOAST:
            store.toasts.find(t => t.id === action.toast.id) ?
                dispatch({ type: ActionType.UPDATE_TOAST, toast: action.toast }) :
                dispatch({ type: ActionType.ADD_TOAST, toast: action.toast });
            break;
        case ActionType.START_PAUSE:
            setStore('pausedAt', Date.now());
            break;
        case ActionType.END_PAUSE:
            const pauseInterval = action.time - (store.pausedAt || 0);
            setStore(produce(s => {
                s.pausedAt = undefined;
                s.toasts.forEach(t => {
                    t.pauseDuration += pauseInterval;
                });
            }));
            break;
    }
};

const defaultTimeouts = {
    blank: 4000,
    error: 4000,
    success: 2000,
    loading: Infinity,
    custom: 4000,
};
const defaultToastOptions = {
    id: '',
    icon: '',
    unmountDelay: 500,
    duration: 3000,
    ariaProps: {
        role: 'status',
        'aria-live': 'polite',
    },
    className: '',
    style: {},
    position: 'top-right',
    iconTheme: {}
};
const defaultToasterOptions = {
    position: 'top-right',
    toastOptions: defaultToastOptions,
    gutter: 8,
    containerStyle: {},
    containerClassName: ''
};
const defaultContainerPadding = '16px';
const defaultContainerStyle = {
    position: 'fixed',
    'z-index': 9999,
    top: defaultContainerPadding,
    bottom: defaultContainerPadding,
    left: defaultContainerPadding,
    right: defaultContainerPadding,
    "pointer-events": 'none'
};

const generateID = (() => {
    let count = 0;
    return () => String(++count);
})();
const mergeContainerOptions = (props) => {
    setDefaultOpts(s => ({
        containerClassName: props.containerClassName ?? s.containerClassName,
        containerStyle: props.containerStyle ?? s.containerStyle,
        gutter: props.gutter ?? s.gutter,
        position: props.position ?? s.position,
        toastOptions: {
            ...props.toastOptions,
        }
    }));
};
const getToastWrapperStyles = (position, offset) => {
    const top = position.includes('top');
    const verticalStyle = top ? { top: 0 } : { bottom: 0 };
    const horizontalStyle = position.includes('center')
        ? { 'justify-content': 'center' }
        : position.includes('right')
            ? { 'justify-content': 'flex-end' }
            : {};
    return {
        left: 0,
        right: 0,
        display: 'flex',
        position: 'absolute',
        transition: `all 230ms cubic-bezier(.21,1.02,.73,1)`,
        transform: `translateY(${offset * (top ? 1 : -1)}px)`,
        ...verticalStyle,
        ...horizontalStyle,
    };
};
const getWrapperYAxisOffset = (toast, position) => {
    const { toasts } = store;
    const gutter = defaultOpts().gutter || defaultToasterOptions.gutter || 8;
    const relevantToasts = toasts.filter(t => ((t.position || position) === position && t.height));
    const toastIndex = relevantToasts.findIndex((t) => t.id === toast.id);
    const toastsBefore = relevantToasts.filter((toast, i) => i < toastIndex && toast.visible).length;
    const offset = relevantToasts
        .slice(0, toastsBefore)
        .reduce((acc, t) => acc + gutter + (t.height || 0), 0);
    return offset;
};
const getToastYDirection = (toast, defaultPos) => {
    const position = toast.position || defaultPos;
    const top = position.includes('top');
    return top ? 1 : -1;
};

let e={data:""},t=t=>"object"==typeof window?((t?t.querySelector("#_goober"):window._goober)||Object.assign((t||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:t||e,l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,a=/\/\*[^]*?\*\/|  +/g,n=/\n+/g,o=(e,t)=>{let r="",l="",a="";for(let n in e){let c=e[n];"@"==n[0]?"i"==n[1]?r=n+" "+c+";":l+="f"==n[1]?o(c,n):n+"{"+o(c,"k"==n[1]?"":t)+"}":"object"==typeof c?l+=o(c,t?t.replace(/([^,])+/g,e=>n.replace(/(^:.*)|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):n):null!=c&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=o.p?o.p(n,c):n+":"+c+";");}return r+(t&&a?t+"{"+a+"}":a)+l},c={},s=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+s(e[r]);return t}return e},i=(e,t,r,i,p)=>{let u=s(e),d=c[u]||(c[u]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return "go"+r})(u));if(!c[d]){let t=u!==e?e:(e=>{let t,r,o=[{}];for(;t=l.exec(e.replace(a,""));)t[4]?o.shift():t[3]?(r=t[3].replace(n," ").trim(),o.unshift(o[0][r]=o[0][r]||{})):o[0][t[1]]=t[2].replace(n," ").trim();return o[0]})(e);c[d]=o(p?{["@keyframes "+d]:t}:t,r?"":"."+d);}return ((e,t,r)=>{-1==t.data.indexOf(e)&&(t.data=r?e+t.data:t.data+e);})(c[d],t,i),d},p=(e,t,r)=>e.reduce((e,l,a)=>{let n=t[a];if(n&&n.call){let e=n(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;n=t?"."+t:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e;}return e+l+(null==n?"":n)},"");function u(e){let r=this||{},l=e.call?e(r.p):e;return i(l.unshift?l.raw?p(l,[].slice.call(arguments,1),r.p):l.reduce((e,t)=>Object.assign(e,t&&t.call?t(r.p):t),{}):l,t(r.target),r.g,r.o,r.k)}u.bind({g:1});let h=u.bind({k:1});

const toastBarBase = {
    display: 'flex',
    'align-items': 'center',
    background: 'white',
    color: '#363636',
    'box-shadow': '0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)',
    'max-width': '350px',
    'pointer-events': 'auto',
    padding: '8px 10px',
    'border-radius': '4px',
    'line-height': '1.3',
    'will-change': 'transform'
};
const entranceAnimation = (direction) => `
0% {transform: translate3d(0,${direction * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`;
const exitAnimation = (direction) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${direction * -150}%,-1px) scale(.4); opacity:0;}
`;
const messageContainer = {
    display: 'flex',
    'align-items': 'center',
    flex: '1 1 auto',
    margin: '4px 10px',
    'white-space': 'pre-line',
};
const iconContainer = {
    'flex-shrink': 0,
    'min-width': '20px',
    'min-height': '20px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'text-align': 'center',
};
const iconCircle = h `from{transform:scale(0)rotate(45deg);opacity:0;}to{transform:scale(1)rotate(45deg);opacity:1;}`;
const pingCircle = h `75%,100%{transform: scale(2.25);opacity:0;}`;
const icon = h `to{stroke-dashoffset: 0;}`;
const infoDot = h `0%{transform:translate3d(0,0,0);opacity:1;}100%{transform:translate3d(0,7px,0)scale(1);opacity:1;}`;
const rotate = h `from{transform: rotate(0deg);}to{transform: rotate(360deg);}`;

const [defaultOpts, setDefaultOpts] = createSignal(defaultToasterOptions);
const createToast = (message, type = 'blank', options) => ({
    ...defaultToastOptions,
    ...defaultOpts().toastOptions,
    ...options,
    type,
    message,
    pauseDuration: 0,
    createdAt: Date.now(),
    visible: true,
    id: options.id || generateID(),
    style: {
        ...defaultToastOptions.style,
        ...defaultOpts().toastOptions?.style,
        ...options.style
    },
    duration: options.duration || defaultOpts().toastOptions?.duration || defaultTimeouts[type],
    position: options.position || defaultOpts().toastOptions?.position || defaultOpts().position || defaultToastOptions.position
});
const createToastCreator = (type) => (message, options = {}) => {
    const existingToast = store.toasts.find(t => t.id === options.id);
    const toast = createToast(message, type, { ...existingToast, duration: undefined, ...options });
    dispatch({ type: ActionType.UPSERT_TOAST, toast });
    return toast.id;
};
const toast = (message, opts) => createToastCreator('blank')(message, opts);
toast.error = createToastCreator('error');
toast.success = createToastCreator('success');
toast.loading = createToastCreator('loading');
toast.custom = createToastCreator('custom');
toast.dismiss = (toastId) => {
    dispatch({
        type: ActionType.DISMISS_TOAST,
        toastId
    });
};
toast.promise = (promise, msgs, opts) => {
    const id = toast.loading(msgs.loading, { ...opts });
    promise
        .then((p) => {
        toast.success(resolveValue(msgs.success, p), {
            id,
            ...opts,
        });
        return p;
    })
        .catch((e) => {
        toast.error(resolveValue(msgs.error, e), {
            id,
            ...opts,
        });
    });
    return promise;
};
toast.remove = (toastId) => {
    dispatch({
        type: ActionType.REMOVE_TOAST,
        toastId
    });
};

const _tmpl$$g = ["<div", " style=\"", "\"", ">", "</div>"];
const Toaster = props => {
  createEffect(() => {
    mergeContainerOptions(props);
  });
  createEffect(() => {
    const timers = createTimers();
    onCleanup(() => {
      if (!timers) return;
      timers.forEach(timer => timer && clearTimeout(timer));
    });
  });
  return ssr(_tmpl$$g, ssrHydrationKey(), ssrStyle({ ...defaultContainerStyle,
    ...props.containerStyle
  }), ssrAttribute("class", escape(props.containerClassName, true), false), escape(createComponent(For, {
    get each() {
      return store.toasts;
    },

    children: toast => createComponent(ToastContainer, {
      toast: toast
    })
  })));
};

const _tmpl$$f = ["<div", " style=\"", "\">", "</div>"],
      _tmpl$2$5 = ["<div", " style=\"", "\"><!--#-->", "<!--/--><div style=\"", "\" ", ">", "</div></div>"];
const ToastBar = props => {
  const [animation, setAnimation] = createSignal('');
  createEffect(() => {
    props.toast.visible ? setAnimation(`${h(entranceAnimation(getToastYDirection(props.toast, props.position)))} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`) : setAnimation(`${h(exitAnimation(getToastYDirection(props.toast, props.position)))}  0.4s forwards cubic-bezier(.06,.71,.55,1)`);
  });
  return ssr(_tmpl$2$5, ssrHydrationKey() + ssrAttribute("class", escape(props.toast.className, true), false), ssrStyle({ ...toastBarBase,
    animation: animation(),
    ...props.toast.style
  }), escape(createComponent(Switch, {
    get children() {
      return [createComponent(Match, {
        get when() {
          return props.toast.icon;
        },

        get children() {
          return ssr(_tmpl$$f, ssrHydrationKey(), ssrStyle(iconContainer), escape(props.toast.icon));
        }

      }), createComponent(Match, {
        get when() {
          return props.toast.type === 'loading';
        },

        get children() {
          return ssr(_tmpl$$f, ssrHydrationKey(), ssrStyle(iconContainer), escape(createComponent(Loader, mergeProps(() => props.toast.iconTheme))));
        }

      }), createComponent(Match, {
        get when() {
          return props.toast.type === 'success';
        },

        get children() {
          return ssr(_tmpl$$f, ssrHydrationKey(), ssrStyle(iconContainer), escape(createComponent(Success, mergeProps(() => props.toast.iconTheme))));
        }

      }), createComponent(Match, {
        get when() {
          return props.toast.type === 'error';
        },

        get children() {
          return ssr(_tmpl$$f, ssrHydrationKey(), ssrStyle(iconContainer), escape(createComponent(Error$1, mergeProps(() => props.toast.iconTheme))));
        }

      })];
    }

  })), ssrStyle(messageContainer), ssrSpread(props.toast.ariaProps, false, true), escape(resolveValue(props.toast.message, props.toast)));
};

const _tmpl$$e = ["<div", " style=\"", "\"", ">", "</div>"];
const activeClass = u`z-index: 9999;> * { pointer-events: auto;}`;
const ToastContainer = props => {
  const calculatePosition = () => {
    const position = props.toast.position || defaultToastOptions.position;
    const offset = getWrapperYAxisOffset(props.toast, position);
    const positionStyle = getToastWrapperStyles(position, offset);
    return positionStyle;
  };

  const [positionStyle, setPositionStyle] = createSignal(calculatePosition());
  createEffect(() => {
    const newStyles = calculatePosition();
    setPositionStyle(newStyles);
  });
  onMount(() => {
  });
  return ssr(_tmpl$$e, ssrHydrationKey(), ssrStyle(positionStyle()), ssrAttribute("class", props.toast.visible ? escape(activeClass, true) : '', false), props.toast.type === 'custom' ? escape(resolveValue(props.toast.message, props.toast)) : escape(createComponent(ToastBar, {
    get toast() {
      return props.toast;
    },

    get position() {
      return props.toast.position || defaultToastOptions.position;
    }

  })));
};

const _tmpl$$d = ["<svg", " style=\"", "\" viewBox=\"0 0 32 32\"><circle style=\"", "\"", " cx=\"16\" cy=\"16\" r=\"16\"></circle><circle style=\"", "\"", " cx=\"16\" cy=\"16\" r=\"12\"></circle><path style=\"", "\" fill=\"none\"", " stroke-width=\"4\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" d=\"M9.8,17.2l3.8,3.6c0.1,0.1,0.3,0.1,0.4,0l9.6-9.7\"></path></svg>"];
const Success = props => {
  const mainCircle = `${iconCircle} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
  const secondaryCircle = `${pingCircle} 1s cubic-bezier(0, 0, 0.2, 1) forwards`;
  const check = `${icon} 0.2s ease-out forwards`;
  return ssr(_tmpl$$d, ssrHydrationKey(), "overflow:" + "visible", "animation:" + escape(mainCircle, true) + (";transform-origin:" + "50% 50%") + (";animation-delay:" + "100ms") + (";opacity:" + 0), ssrAttribute("fill", escape(props.primary, true) || '#34C759', false), "animation:" + escape(secondaryCircle, true) + (";transform-origin:" + "50% 50%") + (";animation-delay:" + "250ms"), ssrAttribute("fill", escape(props.primary, true) || '#34C759', false), "animation:" + escape(check, true) + (";stroke-dasharray:" + 22) + (";stroke-dashoffset:" + 22) + (";animation-delay:" + "250ms"), ssrAttribute("stroke", escape(props.secondary, true) || '#FCFCFC', false));
};

const _tmpl$$c = ["<svg", " style=\"", "\" viewBox=\"0 0 32 32\"><circle style=\"", "\"", " cx=\"16\" cy=\"16\" r=\"16\"></circle><circle style=\"", "\"", " cx=\"16\" cy=\"16\" r=\"12\"></circle><path style=\"", "\" fill=\"none\"", " stroke-width=\"4\" stroke-linecap=\"round\" d=\"M16,7l0,9\"></path><circle style=\"", "\"", " cx=\"16\" cy=\"16\" r=\"2.5\"></circle></svg>"];
const Error$1 = props => {
  const mainCircle = `${iconCircle} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
  const secondaryCircle = `${pingCircle} 1s cubic-bezier(0, 0, 0.2, 1) forwards`;
  const infoDash = `${icon} 0.1s ease-in forwards`;
  const infoCircle = `${infoDot} 0.2s ease-out forwards`;
  return ssr(_tmpl$$c, ssrHydrationKey(), "overflow:" + "visible", "animation:" + escape(mainCircle, true) + (";transform-origin:" + "50% 50%") + (";animation-delay:" + "100ms") + (";opacity:" + 0), ssrAttribute("fill", escape(props.primary, true) || "#FF3B30", false), "animation:" + escape(secondaryCircle, true) + (";transform-origin:" + "50% 50%") + (";animation-delay:" + "320ms"), ssrAttribute("fill", escape(props.primary, true) || "#FF3B30", false), "animation:" + escape(infoDash, true) + (";stroke-dasharray:" + 9) + (";stroke-dashoffset:" + 9) + (";animation-delay:" + "200ms"), ssrAttribute("stroke", escape(props.secondary, true) || "#FFFFFF", false), "animation:" + escape(infoCircle, true) + (";animation-delay:" + "320ms") + (";opacity:" + 0), ssrAttribute("fill", escape(props.secondary, true) || "#FFFFFF", false));
};

const _tmpl$$b = ["<svg", " style=\"", "\" viewBox=\"0 0 32 32\"><path fill=\"none\"", " stroke-width=\"4\" stroke-miterlimit=\"10\" d=\"M16,6c3,0,5.7,1.3,7.5,3.4c1.5,1.8,2.5,4,2.5,6.6c0,5.5-4.5,10-10,10S6,21.6,6,16S10.5,6,16,6z\"></path><path style=\"", "\" fill=\"none\"", " stroke-width=\"4\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" d=\"M16,6c3,0,5.7,1.3,7.5,3.4c0.6,0.7,1.1,1.4,1.5,2.2\"></path></svg>"];
const Loader = props => {
  const animation = `${rotate} 0.75s linear infinite`;
  return ssr(_tmpl$$b, ssrHydrationKey(), "overflow:" + "visible", ssrAttribute("stroke", escape(props.primary, true) || "#E5E7EB", false), "animation:" + escape(animation, true) + (";transform-origin:" + "50% 50%"), ssrAttribute("stroke", escape(props.secondary, true) || "#4b5563", false));
};

toast;

const _tmpl$$a = ["<head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><link rel=\"icon\" href=\"/favicon.ico\">", "", "</head>"],
      _tmpl$2$4 = ["<html", " lang=\"en\">", "<body><!--#-->", "<!--/--><!--#-->", "<!--/--></body></html>"];
function Root() {
  return ssr(_tmpl$2$4, ssrHydrationKey(), NoHydration({
    get children() {
      return ssr(_tmpl$$a, escape(createComponent(Meta, {})), escape(createComponent(Links, {})));
    }

  }), escape(createComponent(ErrorBoundary, {
    get children() {
      return [createComponent(Suspense, {
        get children() {
          return createComponent(Routes, {});
        }

      }), createComponent(Toaster, {})];
    }

  })), escape(createComponent(Scripts, {})));
}

const api = [
  {
    get: "skip",
    path: "/favicon-generator"
  },
  {
    get: "skip",
    path: "/"
  }
];
function routeToMatchRoute(route) {
  const segments = route.path.split("/").filter(Boolean);
  const params = [];
  const matchSegments = [];
  let score = route.path.endsWith("/") ? 4 : 0;
  let wildcard = false;
  for (const [index, segment] of segments.entries()) {
    if (segment[0] === ":") {
      const name = segment.slice(1);
      score += 3;
      params.push({
        type: ":",
        name,
        index
      });
      matchSegments.push(null);
    } else if (segment[0] === "*") {
      params.push({
        type: "*",
        name: segment.slice(1),
        index
      });
      wildcard = true;
    } else {
      score += 4;
      matchSegments.push(segment);
    }
  }
  return {
    ...route,
    score,
    params,
    matchSegments,
    wildcard
  };
}
function getRouteMatches(routes, path, method) {
  const segments = path.split("/").filter(Boolean);
  routeLoop:
    for (const route of routes) {
      const matchSegments = route.matchSegments;
      if (segments.length < matchSegments.length || !route.wildcard && segments.length > matchSegments.length) {
        continue;
      }
      for (let index = 0; index < matchSegments.length; index++) {
        const match = matchSegments[index];
        if (!match) {
          continue;
        }
        if (segments[index] !== match) {
          continue routeLoop;
        }
      }
      const handler = route[method];
      if (handler === "skip" || handler === void 0) {
        return;
      }
      const params = {};
      for (const { type, name, index } of route.params) {
        if (type === ":") {
          params[name] = segments[index];
        } else {
          params[name] = segments.slice(index).join("/");
        }
      }
      return { handler, params };
    }
}
const allRoutes = api.map(routeToMatchRoute).sort((a, b) => b.score - a.score);
function getApiHandler(url, method) {
  return getRouteMatches(allRoutes, url.pathname, method.toLowerCase());
}

class FormError extends Error {
  constructor(message, {
    fieldErrors = {},
    form,
    fields,
    stack
  } = {}) {
    super(message);
    this.formError = message;
    this.name = "FormError";
    this.fields = fields || Object.fromEntries(typeof form !== "undefined" ? form.entries() : []) || {};
    this.fieldErrors = fieldErrors;

    if (stack) {
      this.stack = stack;
    }
  }

}

const XSolidStartLocationHeader = "x-solidstart-location";
const LocationHeader = "Location";
const ContentTypeHeader = "content-type";
const XSolidStartResponseTypeHeader = "x-solidstart-response-type";
const XSolidStartContentTypeHeader = "x-solidstart-content-type";
const XSolidStartOrigin = "x-solidstart-origin";
const JSONResponseType = "application/json";
const redirectStatusCodes = /* @__PURE__ */ new Set([204, 301, 302, 303, 307, 308]);
function isRedirectResponse(response) {
  return response && response instanceof Response && redirectStatusCodes.has(response.status);
}
class ResponseError extends Error {
  constructor(response) {
    let message = JSON.stringify({
      $type: "response",
      status: response.status,
      message: response.statusText,
      headers: [...response.headers.entries()]
    });
    super(message);
    this.name = "ResponseError";
    this.status = response.status;
    this.headers = new Map([...response.headers.entries()]);
    this.url = response.url;
    this.ok = response.ok;
    this.statusText = response.statusText;
    this.redirected = response.redirected;
    this.bodyUsed = false;
    this.type = response.type;
    this.response = () => response;
  }
  clone() {
    return this.response();
  }
  get body() {
    return this.response().body;
  }
  async arrayBuffer() {
    return await this.response().arrayBuffer();
  }
  async blob() {
    return await this.response().blob();
  }
  async formData() {
    return await this.response().formData();
  }
  async text() {
    return await this.response().text();
  }
  async json() {
    return await this.response().json();
  }
}
function respondWith(request, data, responseType) {
  if (data instanceof ResponseError) {
    data = data.clone();
  }
  if (data instanceof Response) {
    if (isRedirectResponse(data) && request.headers.get(XSolidStartOrigin) === "client") {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartLocationHeader, data.headers.get(LocationHeader));
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(null, {
        status: 204,
        headers
      });
    } else {
      data.headers.set(XSolidStartResponseTypeHeader, responseType);
      data.headers.set(XSolidStartContentTypeHeader, "response");
      return data;
    }
  } else if (data instanceof FormError) {
    return new Response(JSON.stringify({
      error: {
        message: data.message,
        stack: data.stack,
        formError: data.formError,
        fields: data.fields,
        fieldErrors: data.fieldErrors
      }
    }), {
      status: 400,
      headers: {
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "form-error"
      }
    });
  } else if (data instanceof Error) {
    return new Response(JSON.stringify({
      error: {
        message: data.message,
        stack: data.stack,
        status: data.status
      }
    }), {
      status: data.status || 500,
      headers: {
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "error"
      }
    });
  } else if (typeof data === "object" || typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        [ContentTypeHeader]: "application/json",
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "json"
      }
    });
  }
  return new Response("null", {
    status: 200,
    headers: {
      [ContentTypeHeader]: "application/json",
      [XSolidStartContentTypeHeader]: "json",
      [XSolidStartResponseTypeHeader]: responseType
    }
  });
}

const server = (fn) => {
  throw new Error("Should be compiled away");
};
async function parseRequest(request) {
  let contentType = request.headers.get(ContentTypeHeader);
  let name = new URL(request.url).pathname, args = [];
  if (contentType) {
    if (contentType === JSONResponseType) {
      let text = await request.text();
      try {
        args = JSON.parse(text, (key, value) => {
          if (!value) {
            return value;
          }
          if (value.$type === "headers") {
            let headers = new Headers();
            request.headers.forEach((value2, key2) => headers.set(key2, value2));
            value.values.forEach(([key2, value2]) => headers.set(key2, value2));
            return headers;
          }
          if (value.$type === "request") {
            return new Request(value.url, {
              method: value.method,
              headers: value.headers
            });
          }
          return value;
        });
      } catch (e) {
        throw new Error(`Error parsing request body: ${text}`);
      }
    } else if (contentType.includes("form")) {
      let formData = await request.formData();
      args = [formData];
    }
  }
  return [name, args];
}
async function handleServerRequest(ctx) {
  const url = new URL(ctx.request.url);
  if (server.hasHandler(url.pathname)) {
    try {
      let [name, args] = await parseRequest(ctx.request);
      let handler = server.getHandler(name);
      if (!handler) {
        throw {
          status: 404,
          message: "Handler Not Found for " + name
        };
      }
      const data = await handler.call(ctx, ...Array.isArray(args) ? args : [args]);
      return respondWith(ctx.request, data, "return");
    } catch (error) {
      return respondWith(ctx.request, error, "throw");
    }
  }
  return null;
}
const handlers = /* @__PURE__ */ new Map();
server.createHandler = (_fn, hash) => {
  let fn = function(...args) {
    let ctx;
    if (typeof this === "object" && this.request instanceof Request) {
      ctx = this;
    } else if (sharedConfig.context && sharedConfig.context.requestContext) {
      ctx = sharedConfig.context.requestContext;
    } else {
      ctx = {
        request: new URL(hash, "http://localhost:3000").href,
        responseHeaders: new Headers()
      };
    }
    const execute = async () => {
      try {
        let e = await _fn.call(ctx, ...args);
        return e;
      } catch (e) {
        if (/[A-Za-z]+ is not defined/.test(e.message)) {
          const error = new Error(e.message + "\n You probably are using a variable defined in a closure in your server function.");
          error.stack = e.stack;
          throw error;
        }
        throw e;
      }
    };
    return execute();
  };
  fn.url = hash;
  fn.action = function(...args) {
    return fn.call(this, ...args);
  };
  return fn;
};
server.registerHandler = function(route, handler) {
  handlers.set(route, handler);
};
server.getHandler = function(route) {
  return handlers.get(route);
};
server.hasHandler = function(route) {
  return handlers.has(route);
};
server.fetch = async function(route, init) {
  let url = new URL(route, "http://localhost:3000");
  const request = new Request(url.href, init);
  const handler = getApiHandler(url, request.method);
  const response = await handler.handler({ request }, handler.params);
  return response;
};

const inlineServerFunctions = ({ forward }) => {
  return async (ctx) => {
    const url = new URL(ctx.request.url);
    if (server.hasHandler(url.pathname)) {
      let contentType = ctx.request.headers.get("content-type");
      let origin = ctx.request.headers.get("x-solidstart-origin");
      let formRequestBody;
      if (contentType != null && contentType.includes("form") && !(origin != null && origin.includes("client"))) {
        let [read1, read2] = ctx.request.body.tee();
        formRequestBody = new Request(ctx.request.url, {
          body: read2,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
        ctx.request = new Request(ctx.request.url, {
          body: read1,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
      }
      const serverResponse = await handleServerRequest(ctx);
      let responseContentType = serverResponse.headers.get("x-solidstart-content-type");
      if (formRequestBody && responseContentType !== null && responseContentType.includes("error")) {
        const formData = await formRequestBody.formData();
        let entries = [...formData.entries()];
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL(ctx.request.headers.get("referer")).pathname + "?form=" + encodeURIComponent(JSON.stringify({
              url: url.pathname,
              entries,
              ...await serverResponse.json()
            }))
          }
        });
      }
      return serverResponse;
    }
    const response = await forward(ctx);
    if (ctx.responseHeaders.get("x-solidstart-status-code")) {
      return new Response(response.body, {
        status: parseInt(ctx.responseHeaders.get("x-solidstart-status-code")),
        headers: response.headers
      });
    }
    return response;
  };
};

const apiRoutes = ({ forward }) => {
  return async (ctx) => {
    let apiHandler = getApiHandler(new URL(ctx.request.url), ctx.request.method);
    if (apiHandler) {
      return await apiHandler.handler(ctx, apiHandler.params);
    }
    return await forward(ctx);
  };
};

const rootData = Object.values({})[0];
const dataFn = rootData ? rootData.default : undefined;
/** Function responsible for listening for streamed [operations]{@link Operation}. */

/** This composes an array of Exchanges into a single ExchangeIO function */
const composeMiddleware = exchanges => ({
  ctx,
  forward
}) => exchanges.reduceRight((forward, exchange) => exchange({
  ctx: ctx,
  forward
}), forward);
function createHandler(...exchanges) {
  const exchange = composeMiddleware([apiRoutes, inlineServerFunctions, ...exchanges]);
  return async request => {
    return await exchange({
      ctx: {
        request
      },
      // fallbackExchange
      forward: async op => {
        return new Response(null, {
          status: 404
        });
      }
    })(request);
  };
}
const docType = ssr("<!DOCTYPE html>");
var StartServer = (({
  context
}) => {
  let pageContext = context;
  pageContext.routerContext = {};
  pageContext.tags = [];

  pageContext.setStatusCode = code => {
    pageContext.responseHeaders.set("x-solidstart-status-code", code.toString());
  };

  pageContext.setHeader = (name, value) => {
    pageContext.responseHeaders.set(name, value.toString());
  }; // @ts-expect-error


  sharedConfig.context.requestContext = context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;
  return createComponent(StartProvider, {
    context: pageContext,

    get children() {
      return createComponent(MetaProvider, {
        get tags() {
          return pageContext.tags;
        },

        get children() {
          return createComponent(Router, {
            url: path,

            get out() {
              return pageContext.routerContext;
            },

            data: dataFn,

            get children() {
              return [docType, createComponent(Root, {})];
            }

          });
        }

      });
    }

  });
});

var entryServer = createHandler(renderAsync(context => createComponent(StartServer, {
  context: context
})));

const _tmpl$$9 = ["<div", "><h1 class=\"mb-1 text-center text-2xl font-semibold\"><!--#-->", "<!--/--> Favicon Generator</h1><h2 class=\"mb-8 text-center text-lg text-slate-400\">Quickly generate a favicon from an image</h2><div class=\"mx-auto mb-10 flex max-w-xs items-center justify-center rounded-full p-2 shadow-lg shadow-slate-200\">", "</div><div>", "</div></div>"],
      _tmpl$2$3 = ["<span", " class=\"absolute top-0 ml-1 rounded-full bg-blue-100 px-2 pt-[1px] pb-[2px] text-xs leading-snug text-blue-500\">soon</span>"],
      _tmpl$3$2 = ["<button", " class=\"", "\"><!--#-->", "<!--/--><!--#-->", "<!--/--></button>"];
var View$1;

(function (View) {
  View[View["Image"] = 0] = "Image";
  View[View["Emoji"] = 1] = "Emoji";
  View[View["Text"] = 2] = "Text";
})(View$1 || (View$1 = {}));

const [view, setView] = createSignal(View$1.Image);
const buttons = [{
  name: 'Image',
  view: View$1.Image
}, {
  name: 'Emoji',
  view: View$1.Emoji
}, {
  name: 'Text',
  view: View$1.Text
}];
const views$1 = {
  [View$1.Image]: lazy(async () => {
    const Provider = (await Promise.resolve().then(function () { return ImageFaviconContext$2; })).default;
    const ImageFavicon = (await Promise.resolve().then(function () { return index$5; })).default;
    return {
      default: () => createComponent(Provider, {
        get children() {
          return createComponent(ImageFavicon, {});
        }

      })
    };
  }),
  [View$1.Emoji]: lazy(() => Promise.resolve().then(function () { return index$3; })),
  [View$1.Text]: lazy(() => Promise.resolve().then(function () { return index$1; }))
};
function Generator () {
  const isImageView = view => view === View$1.Image;

  const currentButton = () => buttons.find(button => button.view === view());

  return ssr(_tmpl$$9, ssrHydrationKey(), escape(currentButton().name), escape(createComponent(For, {
    each: buttons,
    children: button => ssr(_tmpl$3$2, ssrHydrationKey(), `w-1/3 rounded-full px-4 py-2 transition-colors ${view() === button.view ? "bg-blue-500 text-white" : ""} ${view() !== button.view && isImageView(button.view) ? "hover:text-blue-500" : ""} ${!isImageView(button.view) ? "cursor-default relative text-slate-400" : ""}`, escape(button.name), escape(createComponent(Show, {
      get when() {
        return !isImageView(button.view);
      },

      get children() {
        return ssr(_tmpl$2$3, ssrHydrationKey());
      }

    })))
  })), escape(createComponent(Dynamic, {
    get component() {
      return views$1[view()];
    }

  })));
}

const _tmpl$$8 = ["<nav", " class=\"my-5 flex items-center justify-center font-medium text-sm\">", "</nav>"];
function Nav () {
  const isGeneratorActive = useMatch(() => '/favicon-generator'); // const isCheckerActive = useMatch(() => '/favicon-checker')

  return ssr(_tmpl$$8, ssrHydrationKey(), escape(createComponent(Link, {
    href: "/favicon-generator",
    "class": "block px-4 py-2",

    get classList() {
      return {
        'text-blue-500': !!isGeneratorActive()
      };
    },

    children: "Favicon Generator"
  })));
}
/*
<Link
  href="/favicon-checker"
  class="block px-4 py-2"
  classList={{
    'text-blue-500': !!isCheckerActive()
  }}
>
  Favicon Checker
</Link>
*/

const _tmpl$$7 = ["<header", " class=\"fixed top-0 left-0 w-full border-b border-slate-200 bg-white/30 backdrop-blur z-50\"><div class=\"mx-auto flex h-16 max-w-4xl items-center justify-between px-4\"><div class=\"flex items-center\"><div class=\"text-lg font-semibold\">favicoon</div></div><!--#-->", "<!--/--></div></header>"];
function Header () {
  return ssr(_tmpl$$7, ssrHydrationKey(), escape(createComponent(Nav, {})));
}

const _tmpl$$6 = ["<div", " class=\"font-base text-slate-700\"><!--#-->", "<!--/--><div class=\"mx-auto max-w-4xl px-4 pt-28\">", "</div></div>"];
function Layout (props) {
  return ssr(_tmpl$$6, ssrHydrationKey(), escape(createComponent(Header, {})), escape(props.children));
}

function faviconGenerator () {
  return createComponent(Layout, {
    get children() {
      return createComponent(Generator, {});
    }

  });
}

var faviconGenerator$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': faviconGenerator
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$$5 = ["<h1", ">Index</h1>"];
function index$6 () {
  return createComponent(Layout, {
    get children() {
      return ssr(_tmpl$$5, ssrHydrationKey());
    }

  });
}

var index$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': index$6
}, Symbol.toStringTag, { value: 'Module' }));

let View;

(function (View) {
  View[View["Upload"] = 0] = "Upload";
  View[View["ImageInfo"] = 1] = "ImageInfo";
  View[View["Generated"] = 2] = "Generated";
})(View || (View = {}));

const ImageFaviconContext = createContext();
function ImageFaviconContext$1 (props) {
  const [state, setState] = createStore({
    view: View.Upload,
    uploadedImage: null,
    previewIconUrl: null,
    zipBlob: null
  });
  const context = [state, {
    setState
  }];
  return createComponent(ImageFaviconContext.Provider, {
    value: context,

    get children() {
      return props.children;
    }

  });
}
function useImageFavicon() {
  const context = useContext(ImageFaviconContext);

  if (!context) {
    throw new Error('Image Favicon not provided.');
  }

  return context;
}

var ImageFaviconContext$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get View () { return View; },
  'default': ImageFaviconContext$1,
  useImageFavicon: useImageFavicon
}, Symbol.toStringTag, { value: 'Module' }));

const views = {
  [View.Upload]: lazy(() => Promise.resolve().then(function () { return UploadView$1; })),
  [View.ImageInfo]: lazy(() => Promise.resolve().then(function () { return ImageInfoView$1; })),
  [View.Generated]: lazy(() => Promise.resolve().then(function () { return GeneratedView$1; }))
};
function index$4 () {
  const [state] = useImageFavicon();
  return createComponent(Dynamic, {
    get component() {
      return views[state.view];
    }

  });
}

var index$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': index$4
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$$4 = ["<div", ">Emoji</div>"];
function index$2 () {
  return ssr(_tmpl$$4, ssrHydrationKey());
}

var index$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': index$2
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$$3 = ["<div", ">Text</div>"];
function index () {
  return ssr(_tmpl$$3, ssrHydrationKey());
}

var index$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': index
}, Symbol.toStringTag, { value: 'Module' }));

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const _tmpl$$2 = ["<div", " class=\"mx-auto max-w-lg\"><label for=\"file-upload\" class=\"", "\"><div class=\"pointer-events-none flex flex-col items-center justify-center\"><div class=\"", "\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-6 w-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12\"></path></svg></div><p class=\"mt-2 font-medium\">Drag and drop files or browse</p><p class=\"text-sm\">Allowed are PNG, JPG and SVG with max. 1 MB</p></div></label><input id=\"file-upload\" name=\"file\" type=\"file\" class=\"hidden\"", "></div>"],
      _tmpl$2$2 = ["<div", " class=\"mx-auto mt-4 flex max-w-lg flex-col items-center justify-center text-sm  font-medium text-slate-500\"><p class=\"flex justify-center gap-1\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-5 w-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\"></path></svg>For the best result use a square SVG or PNG image with at least 512px</p></div>"];

const allowedFileTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];

function UploadView () {
  useImageFavicon();
  const [isOverDropzone, setIsOverDropzone] = createSignal(false);

  return [ssr(_tmpl$$2, ssrHydrationKey(), `dropzone group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 px-6 py-10 text-slate-400 transition-[border-color,background-color] hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500 ${isOverDropzone() ? "border-blue-500 bg-blue-50 text-blue-500" : ""}`, `flex h-12 w-12 items-center justify-center rounded-full bg-black/5 transition-[background-color,transform] group-hover:bg-blue-100 ${isOverDropzone() ? "bg-blue-100 -translate-y-1" : ""}`, ssrAttribute("accept", escape(allowedFileTypes.join(','), true), false)), ssr(_tmpl$2$2, ssrHydrationKey())];
}

var UploadView$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': UploadView
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$$1 = ["<div", " class=\"text-red-500\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-6 w-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z\"></path></svg></div>"],
      _tmpl$2$1 = ["<div", " class=\"text-green-500\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-6 w-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z\"></path></svg></div>"],
      _tmpl$3$1 = ["<div", " class=\"mx-auto max-w-md\"><h3 class=\"mb-8 text-center font-semibold text-lg\">Your uploaded image</h3><div class=\"flex items-center gap-2 rounded-xl border border-slate-200 p-3 shadow-lg shadow-slate-200\"><div class=\"h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-200\"><img", " class=\"aspect-square h-full w-full object-contain\"></div><div class=\"w-full\"><p class=\"font-medium\">", "</p><p class=\"flex gap-2 text-sm text-slate-400\"><span>", "</span><span class=\"flex-shrink-0\">(<!--#-->", "<!--/-->x<!--#-->", "<!--/-->px, <!--#-->", "<!--/-->)</span></p></div></div><div class=\"my-5 flex items-center justify-center gap-5 text-sm font-medium text-slate-500\"><div class=\"flex items-center gap-1\"><!--#-->", "<!--/-->Square</div><div class=\"flex items-center gap-1\"><!--#-->", "<!--/-->PNG or SVG</div><div class=\"flex items-center gap-1\"><!--#-->", "<!--/-->512px or higher</div></div><div class=\"flex items-center justify-center mt-14\"><button class=\"px-6 py-3 transition-colors hover:text-blue-500\">Re-upload Image</button><button class=\"rounded-xl bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600\">Generate Favicon</button></div></div>"];
const units = ['bytes', 'KB', 'MB'];

const niceBytes = x => {
  let l = 0;
  let n = x || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
};

const XIcon = () => ssr(_tmpl$$1, ssrHydrationKey());

const CheckIcon = () => ssr(_tmpl$2$1, ssrHydrationKey());

function ImageInfoView () {
  const [state, {
    setState
  }] = useImageFavicon();

  const isSquare = () => state.uploadedImage?.width === state.uploadedImage?.height;

  const isPngOrSvg = () => !!(state.uploadedImage?.type && ['image/png', 'image/svg+xml'].includes(state.uploadedImage.type));

  const is512pxOrHigher = () => !!(state.uploadedImage?.width && state.uploadedImage?.width >= 512);

  const infoMessage = () => {
    if (!isSquare()) {
      return 'Your image should be square.';
    }

    if (!isPngOrSvg()) {
      return 'Your image should be a PNG or SVG.';
    }

    if (!is512pxOrHigher()) {
      return 'Your image should be 512px or higher.';
    }

    return "You're good to go!";
  };

  const formattedName = () => {
    if (!state.uploadedImage) return;
    const parts = state.uploadedImage.name.split('.');
    const extension = parts.pop() || '';
    const fileName = parts.join('.');
    const name = fileName.length > 20 ? `${fileName.slice(0, 24)}...` : fileName;
    return `${name}.${extension.toLowerCase()}`;
  };

  const formattedBytes = () => niceBytes(state.uploadedImage?.size || 0);

  return ssr(_tmpl$3$1, ssrHydrationKey(), ssrAttribute("src", escape(state.uploadedImage?.base64, true), false) + ssrAttribute("alt", escape(state.uploadedImage?.name, true), false), escape(infoMessage()), escape(formattedName()), escape(state.uploadedImage?.width), escape(state.uploadedImage?.height), escape(formattedBytes()), escape(createComponent(Show, {
    get when() {
      return isSquare();
    },

    get fallback() {
      return createComponent(XIcon, {});
    },

    get children() {
      return createComponent(CheckIcon, {});
    }

  })), escape(createComponent(Show, {
    get when() {
      return isPngOrSvg();
    },

    get fallback() {
      return createComponent(XIcon, {});
    },

    get children() {
      return createComponent(CheckIcon, {});
    }

  })), escape(createComponent(Show, {
    get when() {
      return is512pxOrHigher();
    },

    get fallback() {
      return createComponent(XIcon, {});
    },

    get children() {
      return createComponent(CheckIcon, {});
    }

  })));
}

var ImageInfoView$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': ImageInfoView
}, Symbol.toStringTag, { value: 'Module' }));

var chromeDark = "/assets/chrome-dark.a71769bd.png";

var chromeLight = "/assets/chrome-light.87085a33.png";

const _tmpl$ = ["<h3", " class=\"mb-8 text-center font-semibold text-lg\">Your favicon is ready!</h3>"],
      _tmpl$2 = ["<div", " class=\"max-w-2xl mx-auto\"><div class=\"flex gap-4 items-center justify-center mb-4\"><div class=\"w-[310px] relative flex-shrink-0\"><img", " class=\"absolute top-[17px] left-[88px] z-5\" width=\"16\" height=\"16\"><img", "></div><div class=\"w-[310px] relative flex-shrink-0\"><img", " class=\"absolute top-[17px] left-[88px] z-5\" width=\"16\" height=\"16\"><img", "></div></div><div class=\"max-w-xl mx-auto mb-4 bg-slate-800 text-white p-4 rounded-xl overflow-auto relative group\"><pre class=\"text-sm font-mono\">&lt;link rel=\"icon\" href=\"/favicon.ico\" sizes=\"any\">\n&lt;link rel=\"icon\" href=\"/favicon.svg\" type=\"image/svg+xml\">\n&lt;link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png\">\n&lt;link rel=\"manifest\" href=\"/manifest.webmanifest\"></pre><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-6 w-6 absolute z-5 top-0 right-0 m-2.5 opacity-0 transition-opacity group-hover:opacity-70\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"></path></svg></div><a", " class=\"rounded-xl bg-blue-500 inline-block px-6 py-3 text-white transition-colors hover:bg-blue-600\" download=\"favicon.zip\">Download Favicon</a></div>"],
      _tmpl$3 = ["<canvas", " class=\"pointer-events-none fixed top-0 left-0 w-full h-full z-100\"></canvas>"];
function GeneratedView () {
  const [state] = useImageFavicon();
  const [zipUrl] = createResource(async () => {
    if (!state.zipBlob) return;
    const url = await readFile(state.zipBlob);
    return url;
  });
  onMount(() => {
  });

  return [ssr(_tmpl$, ssrHydrationKey()), ssr(_tmpl$2, ssrHydrationKey(), ssrAttribute("src", escape(state.previewIconUrl, true), false), ssrAttribute("src", escape(chromeDark, true), false), ssrAttribute("src", escape(state.previewIconUrl, true), false), ssrAttribute("src", escape(chromeLight, true), false), ssrAttribute("href", escape(zipUrl(), true), false)), ssr(_tmpl$3, ssrHydrationKey())];
}

var GeneratedView$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': GeneratedView
}, Symbol.toStringTag, { value: 'Module' }));

export { entryServer as default };
