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
}

export interface ProjectContext {
  tree: string;
  metadata: ProjectMetadata;
  snippets: ScanFileItem[];
  totalTokens: number;
}
