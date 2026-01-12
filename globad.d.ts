// globals.d.ts
declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader } from 'three';
  import { Group } from 'three';

  export class GLTFLoader extends Loader {
    load(
      url: string,
      onLoad: (gltf: { scene: Group }) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}
