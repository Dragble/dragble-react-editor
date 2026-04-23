/**
 * @dragble/react-editor
 * React wrapper for the Dragble Editor SDK
 */

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useMemo,
} from "react";

// Re-export all SDK types from the shared types package
export * from "dragble-types";

import type {
  DragbleSDK,
  DragbleConfig,
  DragbleCallbacks,
  EditorOptions,
  DesignJson,
  ModuleData,
  EditorMode,
  PopupConfig,
  CollaborationFeaturesConfig,
  CommentAction,
  UserInfo,
} from "dragble-types";

declare global {
  interface Window {
    dragble?: DragbleSDK;
    createEditor?: () => DragbleSDK;
  }
}

const SDK_CDN_URL = "https://sdk.dragble.com/latest/dragble-sdk.min.js";

interface SDKModule {
  dragble: DragbleSDK;
  createEditor: (config: any) => DragbleSDK;
  DragbleSDK: any;
}

// Map of URL -> Promise for caching SDK loads per URL
const sdkLoadPromises: Map<string, Promise<SDKModule>> = new Map();

/**
 * Get the SDK URL to use.
 * @param customUrl - Optional custom SDK URL override
 * @param sdkVersion - Optional SDK version to load
 * @returns The SDK URL to load
 */
function getSDKUrl(customUrl?: string, sdkVersion?: string): string {
  if (customUrl && sdkVersion !== undefined) {
    console.warn("[DragbleEditor] sdkVersion is ignored when sdkUrl is provided.");
  }

  return customUrl ?? `https://sdk.dragble.com/${sdkVersion ?? "latest"}/dragble-sdk.min.js`;
}

/**
 * Create an SDK module from the global dragble object.
 * The UMD bundle exposes window.DragbleSDK (named exports) and
 * window.dragble (singleton). Use DragbleSDK.createEditor for
 * multi-instance support, falling back to manual instantiation.
 */
function createSDKModuleFromGlobal(): SDKModule {
  const globalSDK = (window as any).DragbleSDK;
  const globalDragble = (window as any).dragble;

  // Prefer the named export createEditor from the UMD module
  const factoryFn =
    globalSDK?.createEditor ||
    globalDragble?.createEditor ||
    ((config: any) => {
      const instance = new globalDragble.constructor();
      instance.init(config);
      return instance;
    });

  return {
    dragble: globalDragble,
    createEditor: factoryFn,
    DragbleSDK: globalSDK?.DragbleSDK || globalDragble?.constructor,
  };
}

/**
 * Load the SDK from a URL.
 * Supports custom SDK URLs for enterprise self-hosted or specific versions.
 * @param customUrl - Optional custom SDK URL
 */
function loadSDK(customUrl?: string, sdkVersion?: string): Promise<SDKModule> {
  const sdkUrl = getSDKUrl(customUrl, sdkVersion);

  // Check cache for this specific URL
  const cachedPromise = sdkLoadPromises.get(sdkUrl);
  if (cachedPromise) return cachedPromise;

  // Check if already loaded globally (only for default URL to avoid conflicts)
  if (sdkUrl === SDK_CDN_URL && typeof window !== "undefined" && (window as any).dragble) {
    return Promise.resolve(createSDKModuleFromGlobal());
  }

  return loadSDKScript(sdkUrl);
}

/**
 * Load the SDK script from a specific URL.
 * Each unique URL is cached separately to support multiple SDK sources.
 * @param sdkUrl - The SDK URL to load
 */
function loadSDKScript(sdkUrl: string): Promise<SDKModule> {
  // Check cache for this specific URL
  const cachedPromise = sdkLoadPromises.get(sdkUrl);
  if (cachedPromise) return cachedPromise;

  const loadPromise = new Promise<SDKModule>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = sdkUrl;
    script.async = true;

    script.onload = () => {
      if ((window as any).dragble) {
        // Resolve with SDK module interface
        resolve(createSDKModuleFromGlobal());
      } else {
        sdkLoadPromises.delete(sdkUrl);
        reject(
          new Error("Failed to load Dragble SDK - createEditor not found"),
        );
      }
    };

    script.onerror = () => {
      sdkLoadPromises.delete(sdkUrl);
      reject(new Error(`Failed to load Dragble SDK from ${sdkUrl}`));
    };

    document.head.appendChild(script);
  });

  // Cache the promise for this URL
  sdkLoadPromises.set(sdkUrl, loadPromise);

  return loadPromise;
}

export interface DragbleEditorRef {
  editor: DragbleSDK | null;
  isReady: () => boolean;
}

export interface DragbleEditorProps {
  editorKey: string;
  design?: DesignJson | ModuleData | null;
  editorMode?: EditorMode;
  /**
   * Content type for module editing mode.
   * When set to "module", the editor is locked to a single row.
   */
  contentType?: "module";
  /**
   * All editor configuration (appearance, tools, features, AI, storage, etc.).
   * These are placed under `options` in the SDK's DragbleConfig.
   */
  options?: EditorOptions;
  /** Popup builder configuration (only used when editorMode is 'popup') */
  popup?: PopupConfig;
  /**
   * Team collaboration features (commenting, reviewer role, etc.)
   * Can be a simple boolean or detailed configuration object.
   *
   * @example Simple boolean
   * ```tsx
   * <DragbleEditor collaboration={true} />
   * ```
   *
   * @example Reviewer role with mentions
   * ```tsx
   * <DragbleEditor
   *   collaboration={{
   *     enabled: true,
   *     role: 'reviewer',
   *     commenting: {
   *       mentions: true,
   *       getMentions: async (search) => {
   *         const res = await fetch(`/api/team?q=${search}`);
   *         return await res.json();
   *       }
   *     },
   *   }}
   *   onComment={(action) => console.log(action)}
   * />
   * ```
   * @default false
   */
  collaboration?: boolean | CollaborationFeaturesConfig;
  /** User information for session identity and collaboration */
  user?: UserInfo;
  /**
   * Design mode for template permissions.
   * - 'edit': Admin mode - shows "Row Actions" for setting row permissions
   * - 'live': End-user mode - enforces row permissions (selectable, draggable, locked, etc.)
   * @default 'live'
   */
  designMode?: "edit" | "live";
  height?: string | number;
  /**
   * Additional callbacks for the SDK.
   * These are placed under `callbacks` in the SDK's DragbleConfig.
   * Note: onReady, onLoad, onChange, onError are handled via dedicated props.
   */
  callbacks?: Omit<
    DragbleCallbacks,
    "onReady" | "onLoad" | "onChange" | "onError"
  >;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: string | number;
  /**
   * Custom SDK URL for loading the Dragble SDK script.
   * @default "https://sdk.dragble.com/latest/dragble-sdk.min.js"
   */
  sdkUrl?: string;
  /**
   * SDK version to load from the Dragble CDN.
   * @default "latest"
   */
  sdkVersion?: string;
  /** Editor version forwarded to the SDK init config. */
  editorVersion?: string;
  /** Editor URL forwarded to the SDK init config. */
  editorUrl?: string;
  onReady?: (editor: DragbleSDK) => void;
  onLoad?: () => void;
  onChange?: (data: { design: DesignJson; type: string }) => void;
  onError?: (error: Error) => void;
  /** Callback invoked when a comment event occurs (create, edit, delete, resolve, reopen) */
  onComment?: (action: CommentAction) => void;
}

export const DragbleEditor = forwardRef<
  DragbleEditorRef,
  DragbleEditorProps
>((props, ref) => {
  const {
    editorKey,
    design,
    editorMode,
    contentType,
    options = {},
    popup,
    collaboration,
    user,
    designMode,
    height,
    callbacks,
    className,
    style,
    minHeight = "600px",
    sdkUrl,
    sdkVersion,
    editorVersion,
    editorUrl,
    onReady,
    onLoad,
    onChange,
    onError,
    onComment,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<DragbleSDK | null>(null);
  const [hasLoadedSDK, setHasLoadedSDK] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Refs to track current editor and cleanup for proper lifecycle management
  const editorRef = useRef<DragbleSDK | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Stable container ID using useMemo
  const containerId = useMemo(
    () => `dragble-editor-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  // Ref for config to ensure async init always uses the latest config
  const editorOptionsRef = useRef<DragbleConfig | null>(null);

  // Refs for callbacks to avoid dependency issues
  const onReadyRef = useRef(onReady);
  const onLoadRef = useRef(onLoad);
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);
  const onCommentRef = useRef(onComment);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onCommentRef.current = onComment;
  }, [onComment]);

  // Build config object (memoized for comparison)
  const editorOptions = useMemo(() => {
    // Build editor behavior config for module mode
    const editorBehavior =
      contentType === "module"
        ? {
            ...options.editor,
            contentType: "module" as const,
            minRows: 1,
            maxRows: 1,
          }
        : options.editor;

    // Build collaboration feature config
    let featuresConfig = options.features;
    if (collaboration !== undefined) {
      const collaborationWithCallback =
        typeof collaboration === "object"
          ? {
              ...collaboration,
              ...(onCommentRef.current && {
                onComment: onCommentRef.current,
              }),
            }
          : collaboration;
      featuresConfig = {
        ...featuresConfig,
        collaboration: collaborationWithCallback,
      };
    }

    // Build the EditorOptions (nested under options)
    const editorOpts: EditorOptions = {
      ...options,
      ...(user !== undefined && { user }),
      ...(featuresConfig !== undefined && { features: featuresConfig }),
      ...(editorBehavior && { editor: editorBehavior }),
    };

    // Build the top-level DragbleConfig
    return {
      containerId,
      editorKey,
      ...(design !== undefined && { design }),
      ...(editorMode !== undefined && { editorMode }),
      ...(popup !== undefined && { popup }),
      ...(designMode !== undefined && { designMode }),
      ...(editorVersion !== undefined && { editorVersion }),
      ...(editorUrl !== undefined && { editorUrl }),
      callbacks: callbacks || {},
      options: editorOpts,
    } as DragbleConfig;
  }, [
    containerId,
    editorKey,
    design,
    editorMode,
    popup,
    collaboration,
    user,
    designMode,
    contentType,
    options,
    callbacks,
    editorVersion,
    editorUrl,
  ]);

  // Keep the ref in sync so async callbacks always use the latest config
  editorOptionsRef.current = editorOptions;

  // 1. Cleanup effect - runs only on final unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []); // Empty deps - only runs on unmount

  // 2. SDK loading effect
  const resolvedSdkUrl = useMemo(
    () => getSDKUrl(sdkUrl, sdkVersion),
    [sdkUrl, sdkVersion],
  );

  useEffect(() => {
    setHasLoadedSDK(false);
    loadSDK(resolvedSdkUrl)
      .then(() => setHasLoadedSDK(true))
      .catch((err) => onErrorRef.current?.(err));
  }, [resolvedSdkUrl]); // Re-load SDK if URL changes

  // 3. Editor creation effect - ONLY on core props change
  useEffect(() => {
    if (!hasLoadedSDK || !containerRef.current) return;

    // Clean up previous event listeners before creating new editor
    cleanupRef.current?.();
    cleanupRef.current = null;

    // Destroy previous editor BEFORE creating new one
    editorRef.current?.destroy();
    editorRef.current = null;

    const initEditor = async () => {
      try {
        // Import createEditor for multiple instance support
        const { createEditor } = await loadSDK(resolvedSdkUrl);

        // Use the ref to always get the latest config (avoids stale closure)
        const config = editorOptionsRef.current || editorOptions;

        // Create a new editor instance (not singleton)
        const editorInstance = createEditor(config);
        editorRef.current = editorInstance;
        setEditor(editorInstance);

        // Set up event listeners
        const unsubscribeReady = editorInstance.addEventListener(
          "editor:ready",
          () => {
            setIsEditorReady(true);
            onReadyRef.current?.(editorInstance);
          },
        );

        const unsubscribeLoad = editorInstance.addEventListener(
          "design:loaded",
          () => {
            onLoadRef.current?.();
          },
        );

        const unsubscribeChange = editorInstance.addEventListener(
          "design:updated",
          (data: { design: DesignJson; type: string }) => {
            onChangeRef.current?.(data);
          },
        );

        // Store cleanup function for later use by re-init or unmount
        cleanupRef.current = () => {
          unsubscribeReady();
          unsubscribeLoad();
          unsubscribeChange();
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Initialization error:", error.message, error);
        onErrorRef.current?.(error);
      }
    };

    initEditor();
  }, [
    // Only re-init on core props that MUST trigger re-initialization
    containerId,
    editorKey,
    hasLoadedSDK,
  ]);

  // 4. Update options effect - update without re-init
  useEffect(() => {
    if (!editor || !isEditorReady) return;

    // Update modules without re-initialization
    if (editorOptions.options?.modules) {
      editor.setModules(editorOptions.options.modules);
    }

    // Note: Most options can't be updated after init, only modules can be updated
  }, [editor, isEditorReady, editorOptions.options?.modules]);

  useImperativeHandle(
    ref,
    () => ({
      editor: editor,
      isReady: () => isEditorReady,
    }),
    [editor, isEditorReady],
  );

  const effectiveHeight = height ?? minHeight;
  const containerStyle: React.CSSProperties = {
    width: "100%",
    height:
      typeof effectiveHeight === "number"
        ? `${effectiveHeight}px`
        : effectiveHeight,
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <div
        id={containerId}
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
});

DragbleEditor.displayName = "DragbleEditor";

export function useDragbleEditor() {
  const ref = useRef<DragbleEditorRef>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkReady = () => {
      const ready = ref.current?.isReady() ?? false;
      setIsReady(ready);
    };

    checkReady();
    const interval = setInterval(checkReady, 100);
    return () => clearInterval(interval);
  }, []);

  return {
    ref,
    editor: ref.current?.editor ?? null,
    isReady,
  };
}

export default DragbleEditor;
