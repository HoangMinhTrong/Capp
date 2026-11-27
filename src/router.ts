// ============================================
// EduTrack - Router (Hash-based SPA Router)
// ============================================

type RouteHandler = () => void;

interface Route {
  path: string;
  handler: RouteHandler;
  requiredRoles?: string[];
}

class Router {
  private routes: Route[] = [];
  private notFoundHandler: RouteHandler = () => {};

  addRoute(path: string, handler: RouteHandler, requiredRoles?: string[]) {
    this.routes.push({ path, handler, requiredRoles });
    return this;
  }

  setNotFound(handler: RouteHandler) {
    this.notFoundHandler = handler;
    return this;
  }

  navigate(path: string) {
    window.location.hash = path;
  }

  getCurrentPath(): string {
    const raw = window.location.hash.slice(1) || '/';
    // Tách path khỏi query parameters (ví dụ: /classes?tab=progress -> /classes)
    return raw.split('?')[0] || '/';
  }

  getQueryString(): string {
    const raw = window.location.hash.slice(1) || '';
    const qIndex = raw.indexOf('?');
    return qIndex !== -1 ? raw.slice(qIndex + 1) : '';
  }

  getQueryParams(): Record<string, string> {
    const qs = this.getQueryString();
    const params: Record<string, string> = {};
    if (!qs) return params;
    const searchParams = new URLSearchParams(qs);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
    return params;
  }

  start() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
    this.resolve();
  }

  private resolve() {
    const path = this.getCurrentPath();
    const route = this.routes.find(r => {
      if (r.path === path) return true;
      // Support simple params like /students/:id
      const routeParts = r.path.split('/');
      const pathParts = path.split('/');
      if (routeParts.length !== pathParts.length) return false;
      return routeParts.every((part, i) => part.startsWith(':') || part === pathParts[i]);
    });

    if (route) {
      route.handler();
    } else {
      this.notFoundHandler();
    }
  }

  getParams(): Record<string, string> {
    const path = this.getCurrentPath();
    const params: Record<string, string> = {};
    
    for (const route of this.routes) {
      const routeParts = route.path.split('/');
      const pathParts = path.split('/');
      if (routeParts.length !== pathParts.length) continue;
      
      let match = true;
      routeParts.forEach((part, i) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = pathParts[i];
        } else if (part !== pathParts[i]) {
          match = false;
        }
      });
      
      if (match) return params;
    }
    
    return params;
  }
}

export const router = new Router();
