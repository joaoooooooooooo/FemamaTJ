declare interface DurableObjectState {
  storage: {
    delete(key: string | string[]): Promise<void>;
    deleteAll(): Promise<void>;
    list<T = unknown>(options?: { prefix?: string }): Promise<Map<string, T>>;
    put<T = unknown>(key: string, value: T): Promise<void>;
  };
}

declare interface DurableObjectStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare interface DurableObjectId {}

declare interface DurableObjectNamespace {
  get(id: DurableObjectId): DurableObjectStub;
  idFromName(name: string): DurableObjectId;
}

declare module "cloudflare:workers" {
  export abstract class DurableObject<Env = unknown> {
    constructor(ctx: DurableObjectState, env: Env);
    protected ctx: DurableObjectState;
    protected env: Env;
  }
}
