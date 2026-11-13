// TypeScript's DOM lib omits the WebCodecs audio classes (not in every browser yet).
declare class AudioData {
  constructor(init: {
    format: 'f32-planar' | 'f32' | 's16' | 's16-planar';
    sampleRate: number;
    numberOfFrames: number;
    numberOfChannels: number;
    timestamp: number;
    data: BufferSource;
  });
  close(): void;
}
interface AudioEncoderConfig {
  codec: string;
  sampleRate: number;
  numberOfChannels: number;
  bitrate?: number;
}
declare class AudioEncoder {
  constructor(init: { output: (chunk: EncodedAudioChunk, meta?: any) => void; error: (e: DOMException) => void });
  configure(config: AudioEncoderConfig): void;
  encode(data: AudioData): void;
  flush(): Promise<void>;
  close(): void;
  static isConfigSupported(config: AudioEncoderConfig): Promise<{ supported?: boolean }>;
}
