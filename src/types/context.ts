export interface ScanFileItem {
  path: string;
  content: string;
  language: string;
}

export interface ProjectMetadata {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: string[];
  devDependencies?: string[];
  packageManager?: string;
  goVersion?: string;
  template?: string;
  language?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ProjectContext {
  tree: string;
  metadata: ProjectMetadata;
  snippets: ScanFileItem[];
  totalTokens: number;
}

export interface MergerBlock {
  type: 'AI_GENERATED' | 'MANUAL';
  content: string;
  hash?: string;
}

export interface CliResult {
  success: boolean;
  outputPath: string;
  tokensUsed?: { input: number; output: number };
  error?: string;
}
