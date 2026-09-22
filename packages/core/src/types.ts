export type MaybePromise<T> = T | Promise<T>;

export interface FilmServices {
  get<T>(key: string): T | undefined;
  require<T>(key: string): T;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
}

export interface FilmContext<S extends object> {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pixelRatio: number;
  state: S;
  services: FilmServices;
  runtime: FilmRuntimeLike<S>;
}

export interface FilmRuntimeLike<S extends object> {
  readonly duration: number;
  readonly state: S;
  now(): number;
  play(from?: number): void;
  pause(): void;
  seek(time: number): void;
}

export interface FilmModule<S extends object> {
  name: string;
  order?: number;
  init?(ctx: FilmContext<S>): MaybePromise<void>;
  update?(time: number, dt: number, ctx: FilmContext<S>): void;
  resize?(width: number, height: number, ctx: FilmContext<S>): void;
  dispose?(ctx: FilmContext<S>): void;
}

export type FilmModuleFactory<S extends object> = () => FilmModule<S>;

export interface FilmDefinition<S extends object> {
  id: string;
  title: string;
  duration: number;
  createState(): S;
  sample(time: number, state: S): S | void;
  modules: FilmModuleFactory<S>[];
}
