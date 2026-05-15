import { LitElement, css, html, nothing } from "lit";
import type { PropertyValues, TemplateResult } from "lit";

import { resolveEntityAction } from "./lib/entity-actions";
import { entityIcon, entityLabel, entityUsesLampPalette } from "./lib/entity-display";
import { clampCoordinate, MAX_SCALE, MIN_SCALE, zoomAroundPoint } from "./lib/floormap-math";
import {
  clampRoomPoint,
  createRoomLightingBackground,
  MIN_ROOM_POINTS,
  roomClipPath,
  roomContainsPlacement,
  roomPolygonPoints,
  roomStyle,
} from "./lib/rooms";
import type {
  EntityIndexEntry,
  FloorMapCardConfig,
  FloorMapLayout,
  FloorMapPlacement,
  FloorMapPoint,
  FloorMapRoom,
  HassEntity,
  HomeAssistant,
  TransformState,
} from "./lib/types";

const DOMAIN = "floormap";
const FLOORPLAN_API_PATH = `/api/${DOMAIN}/floorplan`;
const EVENT_LAYOUT_UPDATED = "floormap_layout_updated";
const GET_LAYOUT_COMMAND = `${DOMAIN}/get_layout`;
const SAVE_LAYOUT_COMMAND = `${DOMAIN}/save_layout`;
const UPLOAD_FLOORPLAN_COMMAND = `${DOMAIN}/upload_floorplan`;
const MARKER_LONG_PRESS_MS = 450;
const MARKER_LONG_PRESS_MOVE_THRESHOLD = 10;
const FAN_DOUBLE_CLICK_DELAY_MS = 240;
const FAN_SLIDER_HIDE_DELAY_MS = 1000;
const DEFAULT_ROOM_NAME = "New room";

type CompactEntityRegistryEntry = Record<string, unknown>;

const baseStyles = css`
  :host {
    display: block;
    color: var(--primary-text-color);
    --floormap-surface: var(--ha-card-background, var(--card-background-color, #111827));
    --floormap-outline: color-mix(in srgb, var(--divider-color, #334155) 70%, transparent);
    --floormap-accent: var(--primary-color, #2563eb);
    --floormap-accent-soft: color-mix(in srgb, var(--floormap-accent) 16%, transparent);
    --floormap-muted: var(--secondary-text-color, #94a3b8);
  }

  * {
    box-sizing: border-box;
  }

  button,
  input,
  select {
    font: inherit;
  }

  button {
    border: 1px solid var(--floormap-outline);
    background: color-mix(in srgb, var(--floormap-surface) 88%, white 12%);
    color: inherit;
    border-radius: 8px;
    padding: 0.55rem 0.8rem;
    cursor: pointer;
  }

  button:hover {
    border-color: color-mix(in srgb, var(--floormap-accent) 40%, var(--floormap-outline));
  }

  button.primary {
    background: var(--floormap-accent);
    border-color: var(--floormap-accent);
    color: white;
  }

  button:disabled {
    opacity: 0.55;
    cursor: default;
  }

  input[type="search"],
  input[type="text"] {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--floormap-outline);
    background: color-mix(in srgb, var(--floormap-surface) 86%, white 14%);
    color: inherit;
  }

  .muted {
    color: var(--floormap-muted);
  }

  .empty-state {
    display: grid;
    place-items: center;
    min-height: 280px;
    padding: 1.5rem;
    text-align: center;
    color: var(--floormap-muted);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .toolbar-spacer {
    flex: 1 1 auto;
  }

  .map-shell {
    display: grid;
    gap: 0.75rem;
  }

  .map-frame {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--floormap-outline);
    background: #ffffff;
    touch-action: none;
    user-select: none;
  }

  .map-surface {
    position: relative;
    width: 100%;
    aspect-ratio: var(--floormap-aspect-ratio, 16 / 9);
    overflow: hidden;
    cursor: grab;
  }

  .map-surface.panning {
    cursor: grabbing;
  }

  .map-transform {
    position: absolute;
    inset: 0;
    transform-origin: 0 0;
  }

  .map-stage {
    position: absolute;
    background: #ffffff;
  }

  .map-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
  }

  .rooms,
  .room-points-layer,
  .markers {
    position: absolute;
    inset: 0;
  }

  .rooms,
  .room-points-layer {
    pointer-events: none;
  }

  .room {
    position: absolute;
    overflow: hidden;
    border-radius: 12px;
    pointer-events: none;
  }

  .room-lighting {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.96;
  }

  .room-outline-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .room-outline {
    fill: rgba(59, 130, 246, 0.06);
    stroke: rgba(59, 130, 246, 0.46);
    stroke-width: 1.6;
    vector-effect: non-scaling-stroke;
  }

  .room-label {
    position: absolute;
    left: 0.55rem;
    top: 0.55rem;
    z-index: 1;
    max-width: calc(100% - 1.1rem);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.24rem 0.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    color: #0f172a;
    font-size: 0.72rem;
    font-weight: 600;
    box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
    pointer-events: none;
  }

  .room.is-lit .room-outline {
    fill: rgba(255, 244, 216, 0.07);
    stroke: rgba(245, 184, 73, 0.52);
  }

  .room-point-handle {
    position: absolute;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.96);
    background: rgba(37, 99, 235, 0.92);
    box-shadow: 0 1px 6px rgba(15, 23, 42, 0.22);
    transform: translate(-50%, -50%);
    cursor: grab;
    touch-action: none;
    pointer-events: auto;
  }

  .room-point-handle:active {
    cursor: grabbing;
  }

  .room-point-handle.is-draft {
    background: rgba(245, 184, 73, 0.96);
  }

  .room-draft-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .room-draft-shape {
    fill: rgba(59, 130, 246, 0.08);
    stroke: rgba(37, 99, 235, 0.76);
    stroke-width: 1.8;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }

  .marker {
    position: absolute;
    transform: translate(-50%, -100%);
  }

  .marker-button,
  .marker-chip {
    display: inline-grid;
    place-items: center;
    width: calc(2.8rem * var(--marker-scale, 1));
    height: calc(2.8rem * var(--marker-scale, 1));
    min-width: calc(2.8rem * var(--marker-scale, 1));
    min-height: calc(2.8rem * var(--marker-scale, 1));
    aspect-ratio: 1 / 1;
    appearance: none;
    border: 2px solid var(--floormap-outline);
    border-radius: 50%;
    padding: 0;
    overflow: hidden;
    clip-path: circle(50% at 50% 50%);
    background: color-mix(in srgb, var(--floormap-surface) 82%, black 18%);
    color: inherit;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24);
    backdrop-filter: blur(10px);
    line-height: 1;
    flex: 0 0 auto;
  }

  .marker-button {
    cursor: pointer;
  }

  .marker.is-active .marker-button,
  .marker.is-active .marker-chip {
    border-color: color-mix(in srgb, #22c55e 75%, var(--floormap-outline));
    background: color-mix(in srgb, #22c55e 28%, var(--floormap-surface));
  }

  .marker.is-light .marker-button,
  .marker.is-light .marker-chip {
    border-color: rgba(203, 213, 225, 0.9);
    background: rgba(255, 255, 255, 0.96);
    color: #334155;
  }

  .marker.is-light.is-active .marker-button,
  .marker.is-light.is-active .marker-chip {
    border-color: rgba(245, 184, 73, 0.98);
    background: rgba(255, 233, 173, 0.98);
    color: #6b4f00;
    box-shadow: 0 0 0 2px rgba(255, 214, 102, 0.18), 0 8px 22px rgba(255, 196, 76, 0.42);
  }

  .marker.is-muted .marker-button,
  .marker.is-muted .marker-chip {
    opacity: 0.7;
  }

  .marker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(1.25rem * var(--marker-scale, 1));
    height: calc(1.25rem * var(--marker-scale, 1));
    min-width: calc(1.25rem * var(--marker-scale, 1));
    min-height: calc(1.25rem * var(--marker-scale, 1));
    border-radius: 0;
    background: transparent;
    margin: 0;
    padding: 0;
    line-height: 0;
  }

  .marker-icon ha-icon {
    --mdc-icon-size: calc(1.25rem * var(--marker-scale, 1));
    display: block;
    width: calc(1.25rem * var(--marker-scale, 1));
    height: calc(1.25rem * var(--marker-scale, 1));
    margin: 0;
    padding: 0;
    line-height: 0;
    transform: translate(0, 0);
  }

  .placement-hint {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    padding: 0.5rem 0.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--floormap-accent) 18%, var(--floormap-surface));
    border: 1px solid color-mix(in srgb, var(--floormap-accent) 45%, transparent);
    color: inherit;
    backdrop-filter: blur(8px);
  }
`;

function fireEvent(
  node: HTMLElement,
  type: string,
  detail?: Record<string, unknown>,
  options?: EventInit
): void {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: options?.bubbles ?? true,
      cancelable: options?.cancelable ?? false,
      composed: options?.composed ?? true,
    })
  );
}

function defineOnce(tagName: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ctor);
  }
}

function decodeEntityRegistryEntry(entry: CompactEntityRegistryEntry): EntityIndexEntry | null {
  const entityId =
    asString(entry.ei) ??
    asString(entry.entity_id) ??
    asString(entry.eid) ??
    asString(entry.entityId) ??
    asString(entry.id);
  if (!entityId) {
    return null;
  }

  const name =
    asString(entry.en) ??
    asString(entry.display_name) ??
    asString(entry.dn) ??
    asString(entry.name) ??
    asString(entry.n) ??
    asString(entry.original_name) ??
    asString(entry.on) ??
    entityId;

  const icon =
    asString(entry.ic) ??
    asString(entry.icon) ??
    asString(entry.i) ??
    undefined;

  return { entity_id: entityId, name, icon };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function entityIsActive(stateObj: HassEntity | undefined): boolean {
  return Boolean(stateObj && stateObj.state === "on");
}

function entityIsFan(entityId: string): boolean {
  return entityId.startsWith("fan.");
}

function fanSupportsPercentage(serviceIds: string[]): boolean {
  return serviceIds.includes("fan.set_percentage");
}

function fanPercentageStep(stateObj: HassEntity | undefined): number {
  const explicitStep = asNumber(stateObj?.attributes.percentage_step);
  if (explicitStep && explicitStep > 0) {
    return explicitStep;
  }

  const speedCount = asNumber(stateObj?.attributes.speed_count);
  if (speedCount && speedCount > 1) {
    return Math.max(1, Math.round(100 / speedCount));
  }

  return 1;
}

function fanPercentageValue(stateObj: HassEntity | undefined): number {
  const percentage = asNumber(stateObj?.attributes.percentage);
  if (percentage !== undefined) {
    return Math.min(100, Math.max(0, Math.round(percentage)));
  }

  return stateObj?.state === "on" ? 100 : 0;
}

function formatPercentageValue(value: number | null | undefined): string {
  const normalized = Math.min(100, Math.max(0, Math.round(value ?? 0)));
  return `${normalized}%`;
}

function generateRoomId(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function roomPointHandleStyle(point: FloorMapPoint): string {
  return `left:${point.x * 100}%; top:${point.y * 100}%;`;
}

function activeLightPlacementsForRoom(
  room: FloorMapRoom,
  placements: FloorMapPlacement[],
  resolveState: (entityId: string) => HassEntity | undefined,
  resolveIndexEntry?: (entityId: string) => EntityIndexEntry | undefined
): FloorMapPlacement[] {
  return placements.filter((placement) => {
    if (!roomContainsPlacement(room, placement)) {
      return false;
    }
    const stateObj = resolveState(placement.entity_id);
    return (
      entityIsActive(stateObj) &&
      entityUsesLampPalette(placement.entity_id, stateObj, resolveIndexEntry?.(placement.entity_id))
    );
  });
}

function appendCacheBuster(path: string, layout: FloorMapLayout): string {
  const marker = layout.image?.updated_at ?? Date.now().toString();
  return `${path}${path.includes("?") ? "&" : "?"}ts=${encodeURIComponent(marker)}`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read floor plan file"));
        return;
      }
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error("Unable to read floor plan file"));
    reader.readAsDataURL(file);
  });
}

abstract class FloorMapBaseElement extends LitElement {
  static properties = {
    hass: { attribute: false },
    _layout: { state: true },
    _imageUrl: { state: true },
    _loading: { state: true },
    _error: { state: true },
    _scale: { state: true },
    _panX: { state: true },
    _panY: { state: true },
    _surfaceWidth: { state: true },
    _surfaceHeight: { state: true },
  };

  static styles = [baseStyles];

  public hass?: HomeAssistant;

  protected _layout: FloorMapLayout | null = null;
  protected _imageUrl: string | null = null;
  protected _loading = false;
  protected _error: string | null = null;
  protected _scale = 1;
  protected _panX = 0;
  protected _panY = 0;
  protected _surfaceWidth = 0;
  protected _surfaceHeight = 0;

  private _initialized = false;
  private _unsubscribe?: () => void;
  private _resizeObserver?: ResizeObserver;
  private _observedSurface?: HTMLElement;

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      void this._initialize();
    }
    this._ensureSurfaceObservation();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._resizeObserver?.disconnect();
  }

  protected async _initialize(): Promise<void> {
    await this._loadLayout();
    await this._subscribeToLayoutUpdates();
    await this._afterInitialize();
  }

  protected async _afterInitialize(): Promise<void> {
    return Promise.resolve();
  }

  protected async _afterLayoutLoad(_layout: FloorMapLayout): Promise<void> {
    return Promise.resolve();
  }

  protected async _loadLayout(): Promise<void> {
    if (!this.hass) {
      return;
    }
    this._loading = true;
    this._error = null;
    try {
      const layout = await this.hass.callWS<FloorMapLayout>({ type: GET_LAYOUT_COMMAND });
      this._layout = layout;
      this._imageUrl = await this._resolveImageUrl(layout);
      await this._afterLayoutLoad(layout);
    } catch (error) {
      this._layout = null;
      this._imageUrl = null;
      this._error = error instanceof Error ? error.message : "Unable to load FloorMap data";
    } finally {
      this._loading = false;
    }
  }

  protected async _resolveImageUrl(layout: FloorMapLayout): Promise<string | null> {
    if (!layout.image) {
      return null;
    }
    if (layout.image_data_url) {
      return layout.image_data_url;
    }
    return this._signFloorplanUrl(layout);
  }

  protected _resetView(): void {
    this._scale = 1;
    this._panX = 0;
    this._panY = 0;
  }

  protected _zoom(delta: number): void {
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this._scale + delta));
    this._scale = nextScale;
  }

  protected _aspectRatio(): string {
    const width = this._layout?.image?.width;
    const height = this._layout?.image?.height;
    if (width && height) {
      return `${width} / ${height}`;
    }
    return "16 / 9";
  }

  protected _transformState(): TransformState {
    return { scale: this._scale, panX: this._panX, panY: this._panY };
  }

  protected _onWheel(event: WheelEvent): void {
    event.preventDefault();
    const surface = this._mapSurface();
    if (!surface) {
      return;
    }

    const rect = surface.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const nextScale = this._scale + (event.deltaY < 0 ? 0.2 : -0.2);
    const nextTransform = zoomAroundPoint(this._transformState(), anchorX, anchorY, nextScale);
    this._scale = nextTransform.scale;
    this._panX = nextTransform.panX;
    this._panY = nextTransform.panY;
  }

  private async _subscribeToLayoutUpdates(): Promise<void> {
    if (!this.hass?.connection?.subscribeEvents) {
      return;
    }
    this._unsubscribe = await this.hass.connection.subscribeEvents(
      async () => {
        await this._loadLayout();
      },
      EVENT_LAYOUT_UPDATED
    );
  }

  protected async _signFloorplanUrl(layout: FloorMapLayout): Promise<string> {
    const signed = await this.hass!.callWS<{ path: string }>({
      type: "auth/sign_path",
      path: layout.image_url ?? FLOORPLAN_API_PATH,
      expires: 120,
    });
    return appendCacheBuster(signed.path, layout);
  }

  protected _mapSurface(): HTMLElement | null {
    return this.renderRoot.querySelector(".map-surface");
  }

  protected _mapStage(): HTMLElement | null {
    return this.renderRoot.querySelector(".map-stage");
  }

  protected _imageStageStyle(): string {
    if (!this._surfaceWidth || !this._surfaceHeight) {
      return "left:0; top:0; width:100%; height:100%;";
    }

    const imageWidth = this._layout?.image?.width ?? 16;
    const imageHeight = this._layout?.image?.height ?? 9;
    const imageAspect = imageWidth / imageHeight;
    const surfaceAspect = this._surfaceWidth / this._surfaceHeight;

    let width = this._surfaceWidth;
    let height = this._surfaceHeight;
    let left = 0;
    let top = 0;

    if (surfaceAspect > imageAspect) {
      height = this._surfaceHeight;
      width = height * imageAspect;
      left = (this._surfaceWidth - width) / 2;
    } else {
      width = this._surfaceWidth;
      height = width / imageAspect;
      top = (this._surfaceHeight - height) / 2;
    }

    return `left:${left}px; top:${top}px; width:${width}px; height:${height}px;`;
  }

  protected _normalizedPointFromClient(
    clientX: number,
    clientY: number
  ): { x: number; y: number } | null {
    const stage = this._mapStage();
    if (!stage) {
      return null;
    }

    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }

    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    return {
      x: clampCoordinate((clientX - rect.left) / rect.width),
      y: clampCoordinate((clientY - rect.top) / rect.height),
    };
  }

  private _ensureSurfaceObservation(): void {
    const surface = this._mapSurface();
    if (!surface || surface === this._observedSurface) {
      return;
    }

    this._resizeObserver?.disconnect();
    this._observedSurface = surface;
    this._resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) {
        return;
      }
      this._surfaceWidth = rect.width;
      this._surfaceHeight = rect.height;
    });
    this._resizeObserver.observe(surface);

    const rect = surface.getBoundingClientRect();
    this._surfaceWidth = rect.width;
    this._surfaceHeight = rect.height;
  }
}

class FloorMapCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        padding: 0.5rem 0;
      }

      .editor {
        display: grid;
        gap: 0.75rem;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
    `,
  ];

  public hass?: HomeAssistant;
  private _config: FloorMapCardConfig = { type: "custom:floor-map", show_labels: false };

  public setConfig(config: FloorMapCardConfig): void {
    this._config = { type: "custom:floor-map", show_labels: Boolean(config.show_labels) };
  }

  protected override render(): TemplateResult {
    return html`
      <div class="editor">
        <div class="muted">Add it with <code>type: custom:floor-map</code>. For a full-page floor plan, place it in a Home Assistant Panel view.</div>
      </div>
    `;
  }
}

class FloorMapCard extends FloorMapBaseElement {
  static properties = {
    ...FloorMapBaseElement.properties,
    _config: { state: true },
    _isPanning: { state: true },
    _fanSliderEntityId: { state: true },
    _fanSliderValue: { state: true },
  };

  static styles = [
    baseStyles,
    css`
      ha-card {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 0.75rem;
        padding: 0.9rem;
        min-height: clamp(560px, 78vh, 1080px);
        height: 100%;
      }

      .map-shell,
      .map-frame,
      .map-surface {
        height: 100%;
      }

      .map-surface {
        min-height: clamp(480px, 72vh, 980px);
        aspect-ratio: auto;
      }

      .marker.is-fan-slider {
        transform: translate(-50%, -50%);
        z-index: 3;
      }

      .fan-slider-shell {
        display: grid;
        grid-template-columns: auto minmax(6rem, 1fr) auto;
        align-items: center;
        column-gap: 0.7rem;
        width: clamp(13rem, calc(14rem * var(--marker-scale, 1)), 17rem);
        min-height: 2.9rem;
        padding: 0.55rem 0.8rem;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--floormap-accent) 28%, var(--floormap-outline));
        background: color-mix(in srgb, var(--floormap-surface) 90%, white 10%);
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.3);
        backdrop-filter: blur(14px);
        cursor: default;
      }

      .fan-slider-shell .marker-icon {
        width: 1rem;
        height: 1rem;
        min-width: 1rem;
        min-height: 1rem;
        color: color-mix(in srgb, var(--primary-text-color) 88%, var(--floormap-accent));
      }

      .fan-slider-shell .marker-icon ha-icon {
        --mdc-icon-size: 1rem;
        width: 1rem;
        height: 1rem;
      }

      .fan-slider-track {
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .fan-slider-value {
        min-width: 3ch;
        text-align: right;
        font-size: 0.8rem;
        color: color-mix(in srgb, var(--primary-text-color) 78%, var(--floormap-muted));
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .fan-slider-input {
        min-width: 0;
        height: 1.25rem;
        width: 100%;
        margin: 0;
        padding: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        cursor: ew-resize;
      }

      .fan-slider-input:focus {
        outline: none;
      }

      .fan-slider-input::-webkit-slider-runnable-track {
        height: 0.42rem;
        border-radius: 999px;
        background:
          linear-gradient(
            90deg,
            var(--floormap-accent) 0%,
            var(--floormap-accent) var(--fan-slider-progress, 0%),
            color-mix(in srgb, var(--floormap-outline) 72%, transparent) var(--fan-slider-progress, 0%),
            color-mix(in srgb, var(--floormap-outline) 72%, transparent) 100%
          );
      }

      .fan-slider-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 1rem;
        height: 1rem;
        margin-top: -0.29rem;
        border: 2px solid color-mix(in srgb, var(--floormap-accent) 70%, white 30%);
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.24);
      }

      .fan-slider-input::-moz-range-track {
        height: 0.42rem;
        border: 0;
        border-radius: 999px;
        background: color-mix(in srgb, var(--floormap-outline) 72%, transparent);
      }

      .fan-slider-input::-moz-range-progress {
        height: 0.42rem;
        border-radius: 999px;
        background: var(--floormap-accent);
      }

      .fan-slider-input::-moz-range-thumb {
        width: 1rem;
        height: 1rem;
        border: 2px solid color-mix(in srgb, var(--floormap-accent) 70%, white 30%);
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.24);
      }
    `,
  ];

  private _config: FloorMapCardConfig = { type: "custom:floor-map", show_labels: false };
  private _actionCache = new Map<string, string[]>();
  private _panState:
    | {
        pointerId: number;
        startX: number;
        startY: number;
        startPanX: number;
        startPanY: number;
      }
    | undefined;
  private _isPanning = false;
  private _markerPressState:
    | {
        pointerId: number;
        entityId: string;
        startX: number;
        startY: number;
        timeoutId: number;
      }
    | undefined;
  private _suppressedClick:
    | {
        entityId: string;
        until: number;
      }
    | undefined;
  private _fanSliderEntityId: string | null = null;
  private _fanSliderValue: number | null = null;
  private _fanSliderHideTimeout?: number;
  private _pendingFanClicks = new Map<string, number>();

  public static getConfigElement(): HTMLElement {
    return document.createElement("floor-map-card-editor");
  }

  public static getStubConfig(): Omit<FloorMapCardConfig, "type"> {
    return { show_labels: false };
  }

  public setConfig(config: FloorMapCardConfig): void {
    this._config = {
      type: "custom:floor-map",
      show_labels: Boolean(config.show_labels),
    };
  }

  public getCardSize(): number {
    return 12;
  }

  protected override render(): TemplateResult {
    return html`
      <ha-card>
        <div class="toolbar">
          <button @click=${() => this._zoom(0.2)}>Zoom in</button>
          <button @click=${() => this._zoom(-0.2)}>Zoom out</button>
          <button @click=${this._resetView}>Reset</button>
          <div class="toolbar-spacer"></div>
          <span class="muted">FloorMap</span>
        </div>
        ${this._renderMap()}
      </ha-card>
    `;
  }

  private _renderMap(): TemplateResult {
    if (this._loading) {
      return html`<div class="empty-state">Loading floor plan…</div>`;
    }

    if (this._error) {
      return html`<div class="empty-state">${this._error}</div>`;
    }

    if (!this._layout?.image || !this._imageUrl) {
      return html`<div class="empty-state">Open the FloorMap sidebar page to upload a floor plan and place entities.</div>`;
    }

    return html`
      <div class="map-shell">
        <div class="map-frame">
          <div
            class="map-surface ${this._isPanning ? "panning" : ""}"
            style=${`--floormap-aspect-ratio:${this._aspectRatio()};`}
            @wheel=${this._onWheel}
            @pointerdown=${this._onPanStart}
            @pointermove=${this._onPanMove}
            @pointerup=${this._onPanEnd}
            @pointercancel=${this._onPanEnd}
          >
            <div
              class="map-transform"
              style=${`transform: translate(${this._panX}px, ${this._panY}px) scale(${this._scale});`}
            >
              <div class="map-stage" style=${this._imageStageStyle()}>
                <img class="map-image" src=${this._imageUrl} alt="Floor plan" />
                <div class="rooms">
                  ${this._layout.rooms.map((room) => this._renderCardRoom(room))}
                </div>
                <div class="markers">
                  ${this._layout.placements.map((placement) => this._renderCardMarker(placement))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _renderCardRoom(room: FloorMapRoom): TemplateResult {
    const activeLights = activeLightPlacementsForRoom(
      room,
      this._layout?.placements ?? [],
      (entityId) => this.hass?.states[entityId]
    );
    const background = createRoomLightingBackground(room, activeLights);
    return html`
      <div class="room ${background ? "is-lit" : ""}" style=${roomStyle(room)}>
        <div
          class="room-lighting"
          style=${`${background ? `background:${background};` : ""} clip-path:${roomClipPath(room)};`}
        ></div>
        <svg class="room-outline-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon class="room-outline" points=${roomPolygonPoints(room)}></polygon>
        </svg>
        <div class="room-label">${room.name}</div>
      </div>
    `;
  }

  private _renderCardMarker(placement: FloorMapPlacement): TemplateResult {
    const stateObj = this.hass?.states[placement.entity_id];
    const icon = entityIcon(placement.entity_id, stateObj, undefined);
    const label = entityLabel(stateObj, undefined, placement.entity_id);
    const isLight = entityUsesLampPalette(placement.entity_id, stateObj, undefined);
    const isFanSlider = this._fanSliderEntityId === placement.entity_id;
    const markerClasses = [
      "marker",
      isLight ? "is-light" : "",
      isFanSlider ? "is-fan-slider" : "",
      entityIsActive(stateObj) ? "is-active" : "",
      stateObj ? "" : "is-muted",
    ]
      .filter(Boolean)
      .join(" ");

    if (isFanSlider) {
      const sliderValue = this._fanSliderValue ?? fanPercentageValue(stateObj);
      const sliderStep = fanPercentageStep(stateObj);
      return html`
        <div
          class=${markerClasses}
          style=${`left:${placement.x * 100}%; top:${placement.y * 100}%; --marker-scale:${placement.size ?? 1};`}
        >
          <div
            class="fan-slider-shell"
            role="group"
            aria-label=${`${label} speed control`}
            style=${`--fan-slider-progress:${Math.min(100, Math.max(0, Math.round(sliderValue)))}%;`}
            @mouseenter=${this._onFanSliderEnter}
            @mouseleave=${this._onFanSliderLeave}
            @pointerdown=${this._onFanSliderEnter}
            @pointerleave=${this._onFanSliderLeave}
          >
            <span class="marker-icon"><ha-icon .icon=${icon}></ha-icon></span>
            <div class="fan-slider-track">
              <input
                class="fan-slider-input"
                type="range"
                min="0"
                max="100"
                step=${String(sliderStep)}
                .value=${String(Math.min(100, Math.max(0, Math.round(sliderValue))))}
                @input=${(event: Event) => this._onFanSliderInput(event)}
                @change=${(event: Event) => this._onFanSliderCommit(placement.entity_id, event)}
              />
            </div>
            <span class="fan-slider-value">${formatPercentageValue(sliderValue)}</span>
          </div>
        </div>
      `;
    }

    return html`
      <div
        class=${markerClasses}
        style=${`left:${placement.x * 100}%; top:${placement.y * 100}%; --marker-scale:${placement.size ?? 1};`}
      >
        <button
          class="marker-button"
          title=${label}
          aria-label=${label}
          @pointerdown=${(event: PointerEvent) => this._onMarkerPointerDown(placement.entity_id, event)}
          @pointermove=${this._onMarkerPointerMove}
          @pointerup=${this._onMarkerPointerEnd}
          @pointercancel=${this._onMarkerPointerEnd}
          @pointerleave=${this._onMarkerPointerLeave}
          @click=${(event: MouseEvent) => this._onMarkerClick(placement.entity_id, event)}
          @dblclick=${(event: MouseEvent) => this._onMarkerDoubleClick(placement.entity_id, event)}
        >
          <span class="marker-icon"><ha-icon .icon=${icon}></ha-icon></span>
        </button>
      </div>
    `;
  }

  private _onMarkerPointerDown(entityId: string, event: PointerEvent): void {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    this._clearMarkerPressState();

    const button = event.currentTarget as HTMLElement | null;
    button?.setPointerCapture(event.pointerId);

    const timeoutId = window.setTimeout(() => {
      if (
        !this._markerPressState ||
        this._markerPressState.pointerId !== event.pointerId ||
        this._markerPressState.entityId !== entityId
      ) {
        return;
      }

      this._suppressedClick = {
        entityId,
        until: Date.now() + 800,
      };
      this._openMoreInfo(entityId);
    }, MARKER_LONG_PRESS_MS);

    this._markerPressState = {
      pointerId: event.pointerId,
      entityId,
      startX: event.clientX,
      startY: event.clientY,
      timeoutId,
    };
  }

  private _onMarkerPointerMove = (event: PointerEvent): void => {
    if (!this._markerPressState || this._markerPressState.pointerId !== event.pointerId) {
      return;
    }

    const movedX = event.clientX - this._markerPressState.startX;
    const movedY = event.clientY - this._markerPressState.startY;
    if (Math.hypot(movedX, movedY) >= MARKER_LONG_PRESS_MOVE_THRESHOLD) {
      this._clearMarkerPressState(event);
    }
  };

  private _onMarkerPointerLeave = (event: PointerEvent): void => {
    if (!this._markerPressState || this._markerPressState.pointerId !== event.pointerId) {
      return;
    }
    this._clearMarkerPressState(event);
  };

  private _onMarkerPointerEnd = (event: PointerEvent): void => {
    if (!this._markerPressState || this._markerPressState.pointerId !== event.pointerId) {
      return;
    }
    this._clearMarkerPressState(event);
  };

  private _onMarkerClick(entityId: string, event: MouseEvent): void {
    if (
      this._suppressedClick?.entityId === entityId &&
      this._suppressedClick.until > Date.now()
    ) {
      this._suppressedClick = undefined;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this._fanSliderEntityId === entityId) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (entityIsFan(entityId)) {
      const existingTimer = this._pendingFanClicks.get(entityId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      const timerId = window.setTimeout(() => {
        this._pendingFanClicks.delete(entityId);
        void this._handleEntityTap(entityId);
      }, FAN_DOUBLE_CLICK_DELAY_MS);
      this._pendingFanClicks.set(entityId, timerId);
      return;
    }

    void this._handleEntityTap(entityId);
  }

  private _onMarkerDoubleClick(entityId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const pendingClick = this._pendingFanClicks.get(entityId);
    if (pendingClick) {
      window.clearTimeout(pendingClick);
      this._pendingFanClicks.delete(entityId);
    }

    void this._openFanSlider(entityId);
  }

  private async _handleEntityTap(entityId: string): Promise<void> {
    if (!this.hass) {
      return;
    }
    const stateObj = this.hass.states[entityId];
    const serviceIds = await this._serviceIdsForEntity(entityId);
    const action = resolveEntityAction(serviceIds, entityId, stateObj?.state);

    if (action) {
      await this.hass.callService(action.domain, action.service, { entity_id: entityId });
      return;
    }

    this._openMoreInfo(entityId);
  }

  private async _serviceIdsForEntity(entityId: string): Promise<string[]> {
    if (this._actionCache.has(entityId)) {
      return this._actionCache.get(entityId)!;
    }
    const serviceIds = await this.hass!.callWS<string[]>({
      type: "get_services_for_target",
      target: { entity_id: [entityId] },
      expand_group: false,
    });
    this._actionCache.set(entityId, serviceIds);
    return serviceIds;
  }

  private _onPanStart(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest(".marker-button") || target.closest(".fan-slider-shell")) {
      return;
    }
    const surface = this._mapSurface();
    if (!surface) {
      return;
    }
    this._panState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: this._panX,
      startPanY: this._panY,
    };
    this._isPanning = true;
    surface.setPointerCapture(event.pointerId);
  }

  private _onPanMove(event: PointerEvent): void {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }
    this._panX = this._panState.startPanX + (event.clientX - this._panState.startX);
    this._panY = this._panState.startPanY + (event.clientY - this._panState.startY);
  }

  private _onPanEnd(event: PointerEvent): void {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }
    const surface = this._mapSurface();
    surface?.releasePointerCapture(event.pointerId);
    this._panState = undefined;
    this._isPanning = false;
  }

  private _clearMarkerPressState(event?: PointerEvent): void {
    if (!this._markerPressState) {
      return;
    }

    window.clearTimeout(this._markerPressState.timeoutId);

    if (event?.currentTarget instanceof HTMLElement) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released.
      }
    }

    this._markerPressState = undefined;
  }

  private _openMoreInfo(entityId: string): void {
    if (!this.hass?.states[entityId]) {
      return;
    }
    fireEvent(this, "hass-more-info", { entityId });
  }

  private async _openFanSlider(entityId: string): Promise<void> {
    if (!this.hass || !entityIsFan(entityId)) {
      return;
    }

    const serviceIds = await this._serviceIdsForEntity(entityId);
    if (!fanSupportsPercentage(serviceIds)) {
      return;
    }

    this._clearFanSliderHideTimeout();
    this._fanSliderEntityId = entityId;
    this._fanSliderValue = fanPercentageValue(this.hass.states[entityId]);
  }

  private _onFanSliderInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement | null;
    if (!input) {
      return;
    }
    this._clearFanSliderHideTimeout();
    this._fanSliderValue = Math.min(100, Math.max(0, Math.round(Number(input.value))));
  }

  private async _onFanSliderCommit(entityId: string, event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement | null;
    if (!input || !this.hass) {
      return;
    }

    this._clearFanSliderHideTimeout();
    const percentage = Math.min(100, Math.max(0, Math.round(Number(input.value))));
    this._fanSliderValue = percentage;
    await this.hass.callService("fan", "set_percentage", {
      entity_id: entityId,
      percentage,
    });
  }

  private _onFanSliderEnter = (): void => {
    this._clearFanSliderHideTimeout();
  };

  private _onFanSliderLeave = (): void => {
    this._scheduleFanSliderHide();
  };

  private _scheduleFanSliderHide(): void {
    this._clearFanSliderHideTimeout();
    this._fanSliderHideTimeout = window.setTimeout(() => {
      this._fanSliderEntityId = null;
      this._fanSliderValue = null;
      this._fanSliderHideTimeout = undefined;
    }, FAN_SLIDER_HIDE_DELAY_MS);
  }

  private _clearFanSliderHideTimeout(): void {
    if (this._fanSliderHideTimeout === undefined) {
      return;
    }

    window.clearTimeout(this._fanSliderHideTimeout);
    this._fanSliderHideTimeout = undefined;
  }
}

class FloorMapPanel extends FloorMapBaseElement {
  static properties = {
    ...FloorMapBaseElement.properties,
    _entities: { state: true },
    _query: { state: true },
    _draftPlacements: { state: true },
    _draftRooms: { state: true },
    _pendingEntityId: { state: true },
    _pendingRoomName: { state: true },
    _roomName: { state: true },
    _pendingRoomPoints: { state: true },
    _saving: { state: true },
    _uploading: { state: true },
    _dirty: { state: true },
    _isPanning: { state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        min-height: 100%;
      }

      .panel {
        display: grid;
        grid-template-columns: minmax(280px, 340px) 1fr;
        min-height: calc(100vh - 80px);
      }

      .sidebar {
        display: grid;
        gap: 1rem;
        padding: 1rem;
        border-right: 1px solid var(--floormap-outline);
        background: color-mix(in srgb, var(--floormap-surface) 82%, black 18%);
      }

      .section {
        display: grid;
        gap: 0.75rem;
        align-content: start;
      }

      .section h2,
      .section h3 {
        margin: 0;
        font-size: 0.98rem;
      }

      .main {
        display: grid;
        gap: 1rem;
        padding: 1rem;
      }

      .panel-map {
        min-height: 500px;
      }

      .entity-list,
      .room-list,
      .placed-list {
        display: grid;
        gap: 0.5rem;
        max-height: 320px;
        overflow: auto;
      }

      .entity-row,
      .room-row,
      .placed-row {
        display: grid;
        gap: 0.45rem;
        padding: 0.7rem;
        border: 1px solid var(--floormap-outline);
        border-radius: 8px;
        background: color-mix(in srgb, var(--floormap-surface) 88%, white 12%);
      }

      .entity-row-top,
      .room-row-top,
      .placed-row-top {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .entity-meta,
      .room-meta,
      .placed-meta {
        min-width: 0;
        flex: 1 1 auto;
      }

      .entity-name,
      .room-name,
      .placed-name {
        font-weight: 600;
      }

      .entity-id,
      .room-details,
      .placed-id {
        font-size: 0.78rem;
        color: var(--floormap-muted);
        word-break: break-all;
      }

      .row-actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        gap: 0.55rem;
      }

      .size-row {
        display: grid;
        gap: 0.4rem;
      }

      .size-row label {
        font-size: 0.82rem;
        color: var(--floormap-muted);
      }

      .size-input {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
        align-items: center;
      }

      .size-value {
        min-width: 2.4rem;
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--floormap-muted);
      }

      .map-frame {
        min-height: 500px;
      }

      .map-surface {
        min-height: 500px;
      }

      .marker-chip {
        cursor: grab;
        touch-action: none;
      }

      .room-input {
        width: 100%;
      }

      .marker-chip:active {
        cursor: grabbing;
      }

      .status-banner {
        padding: 0.6rem 0.8rem;
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--floormap-accent) 38%, transparent);
        background: color-mix(in srgb, var(--floormap-accent) 14%, var(--floormap-surface));
      }

      @media (max-width: 1100px) {
        .panel {
          grid-template-columns: 1fr;
        }

        .sidebar {
          border-right: 0;
          border-bottom: 1px solid var(--floormap-outline);
        }
      }
    `,
  ];

  private _entities: EntityIndexEntry[] = [];
  private _query = "";
  private _draftPlacements: FloorMapPlacement[] = [];
  private _draftRooms: FloorMapRoom[] = [];
  private _pendingEntityId: string | null = null;
  private _pendingRoomName: string | null = null;
  private _pendingRoomPoints: FloorMapPoint[] = [];
  private _roomName = "";
  private _saving = false;
  private _uploading = false;
  private _dirty = false;
  private _isPanning = false;
  private _panState:
    | {
        mode: "pan";
        pointerId: number;
        startX: number;
        startY: number;
        startPanX: number;
        startPanY: number;
      }
    | {
        mode: "marker";
        pointerId: number;
        entityId: string;
      }
    | {
        mode: "room-point";
        pointerId: number;
        roomId: string;
        pointIndex: number;
      }
    | undefined;

  protected override async _afterInitialize(): Promise<void> {
    await this._loadEntityIndex();
  }

  protected override async _afterLayoutLoad(layout: FloorMapLayout): Promise<void> {
    this._draftPlacements = layout.placements.map((placement) => ({ ...placement }));
    this._draftRooms = layout.rooms.map((room) => ({
      ...room,
      points: room.points.map((point) => ({ ...point })),
    }));
    this._dirty = false;
    this._pendingEntityId = null;
    this._pendingRoomName = null;
    this._pendingRoomPoints = [];
    this._resetView();
  }

  protected override render(): TemplateResult {
    return html`
      <div class="panel">
        <aside class="sidebar">
          <section class="section">
            <h2>FloorMap</h2>
            <div class="muted">
              Upload one floor plan, place entities on it, and save the shared layout.
            </div>
          </section>

          <section class="section">
            <h3>Floor plan</h3>
            <label class="row-actions">
              <input
                type="file"
                accept="image/png,image/jpeg"
                @change=${this._onUploadFloorplan}
                ?disabled=${this._uploading}
              />
            </label>
            <div class="muted">
              ${this._layout?.image
                ? `Current file: ${this._layout.image.filename}`
                : "No floor plan uploaded yet."}
            </div>
          </section>

          <section class="section">
            <h3>Add entity</h3>
            <input
              type="search"
              placeholder="Search entities"
              .value=${this._query}
              @input=${this._onQueryInput}
            />
            <div class="entity-list">
              ${this._filteredEntities().map((entry) => this._renderEntityRow(entry))}
            </div>
          </section>

          <section class="section">
            <h3>Rooms</h3>
            <div class="muted">Click points around a room, then press Done to save the boundary.</div>
            <input
              class="room-input"
              type="text"
              placeholder="Room name"
              .value=${this._roomName}
              @input=${this._onRoomNameInput}
            />
            <div class="row-actions">
              <button @click=${this._startRoomDraw}>
                ${this._pendingRoomName ? "Drawing room…" : "Draw room"}
              </button>
              ${this._pendingRoomName
                ? html`<button @click=${this._undoPendingRoomPoint} ?disabled=${!this._pendingRoomPoints.length}>Undo point</button>`
                : nothing}
              ${this._pendingRoomName
                ? html`<button @click=${this._finishRoomDraw} ?disabled=${this._pendingRoomPoints.length < MIN_ROOM_POINTS}>Done</button>`
                : nothing}
              ${this._pendingRoomName
                ? html`<button @click=${this._cancelRoomDraw}>Cancel</button>`
                : nothing}
            </div>
            <div class="room-list">
              ${this._draftRooms.length
                ? this._draftRooms.map((room) => this._renderRoomRow(room))
                : html`<div class="muted">No rooms defined yet.</div>`}
            </div>
          </section>

          <section class="section">
            <h3>Placed entities</h3>
            <div class="muted">Drag markers on the map to reposition them. Use the size slider to control how large they appear in the viewer.</div>
            <div class="placed-list">
              ${this._draftPlacements.length
                ? this._draftPlacements.map((placement) => this._renderPlacedRow(placement))
                : html`<div class="muted">No entities placed yet.</div>`}
            </div>
          </section>
        </aside>

        <main class="main">
          <div class="toolbar">
            <button @click=${() => this._zoom(0.2)}>Zoom in</button>
            <button @click=${() => this._zoom(-0.2)}>Zoom out</button>
            <button @click=${this._resetView}>Reset</button>
            <div class="toolbar-spacer"></div>
            ${this._pendingRoomName
              ? html`
                  <span class="status-banner">
                    Click points for ${this._pendingRoomName}, then press Done.
                  </span>
                  <button @click=${this._undoPendingRoomPoint} ?disabled=${!this._pendingRoomPoints.length}>Undo point</button>
                  <button @click=${this._finishRoomDraw} ?disabled=${this._pendingRoomPoints.length < MIN_ROOM_POINTS}>Done</button>
                  <button @click=${this._cancelRoomDraw}>Cancel</button>
                `
              : nothing}
            ${this._pendingEntityId
              ? html`
                  <span class="status-banner">
                    Click the floor plan to place ${this._pendingEntityLabel()}.
                  </span>
                  <button @click=${this._cancelPendingPlacement}>Cancel</button>
                `
              : nothing}
            <button
              class="primary"
              @click=${this._saveLayout}
              ?disabled=${this._saving || !this._dirty}
            >
              ${this._saving ? "Saving…" : "Save layout"}
            </button>
          </div>
          ${this._renderEditorMap()}
        </main>
      </div>
    `;
  }

  private _renderEditorMap(): TemplateResult {
    if (this._loading) {
      return html`<div class="empty-state">Loading floor plan…</div>`;
    }

    if (this._error) {
      return html`<div class="empty-state">${this._error}</div>`;
    }

    if (!this._layout?.image || !this._imageUrl) {
      return html`<div class="empty-state">Upload a PNG or JPG floor plan to start placing entities.</div>`;
    }

    return html`
      <div class="map-shell panel-map">
        <div class="map-frame">
          <div
            class="map-surface ${this._isPanning ? "panning" : ""}"
            style=${`--floormap-aspect-ratio:${this._aspectRatio()};`}
            @wheel=${this._onWheel}
            @pointerdown=${this._onEditorPointerDown}
            @pointermove=${this._onEditorPointerMove}
            @pointerup=${this._onEditorPointerUp}
            @pointercancel=${this._onEditorPointerUp}
            @click=${this._onEditorMapClick}
          >
            ${this._pendingEntityId
              ? html`<div class="placement-hint">Click to place ${this._pendingEntityLabel()}.</div>`
              : nothing}
            <div
              class="map-transform"
              style=${`transform: translate(${this._panX}px, ${this._panY}px) scale(${this._scale});`}
            >
              <div class="map-stage" style=${this._imageStageStyle()}>
                <img class="map-image" src=${this._imageUrl} alt="Floor plan" />
                <div class="rooms">
                  ${this._draftRooms.map((room) => this._renderEditorRoom(room))}
                  ${this._pendingRoomPoints.length >= MIN_ROOM_POINTS ? this._renderDraftRoom() : nothing}
                </div>
                <div class="room-points-layer">
                  ${this._draftRooms.map((room) => this._renderRoomPointHandles(room))}
                  ${this._pendingRoomPoints.map(
                    (point, index) => html`<div
                      class="room-point-handle is-draft"
                      style=${roomPointHandleStyle(point)}
                      title=${`Draft point ${index + 1}`}
                    ></div>`
                  )}
                </div>
                <div class="markers">
                  ${this._draftPlacements.map((placement) => this._renderEditorMarker(placement))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _renderRoomRow(room: FloorMapRoom): TemplateResult {
    return html`
      <div class="room-row">
        <div class="room-row-top">
          <div class="room-meta">
            <div class="room-name">${room.name}</div>
            <div class="room-details">
              ${room.points.length} points
            </div>
          </div>
        </div>
        <input
          type="text"
          .value=${room.name}
          @input=${(event: Event) => this._updateRoomName(room.id, event)}
        />
        <div class="row-actions">
          <button @click=${() => this._removeRoom(room.id)}>Remove</button>
        </div>
      </div>
    `;
  }

  private _renderEntityRow(entry: EntityIndexEntry): TemplateResult {
    const stateObj = this.hass?.states[entry.entity_id];
    return html`
      <div class="entity-row">
        <div class="entity-row-top">
          <span class="marker-icon"><ha-icon .icon=${entityIcon(entry.entity_id, stateObj, entry)}></ha-icon></span>
          <div class="entity-meta">
            <div class="entity-name">${entry.name}</div>
            <div class="entity-id">${entry.entity_id}</div>
          </div>
        </div>
        <div class="row-actions">
          <button @click=${() => this._startPlacement(entry.entity_id)}>Place</button>
        </div>
      </div>
    `;
  }

  private _renderPlacedRow(placement: FloorMapPlacement): TemplateResult {
    const stateObj = this.hass?.states[placement.entity_id];
    const indexEntry = this._entityIndex(placement.entity_id);
    const label = entityLabel(stateObj, indexEntry, placement.entity_id);
    return html`
      <div class="placed-row">
        <div class="placed-row-top">
          <span class="marker-icon"><ha-icon .icon=${entityIcon(placement.entity_id, stateObj, indexEntry)}></ha-icon></span>
          <div class="placed-meta">
            <div class="placed-name">${label}</div>
            <div class="placed-id">${placement.entity_id}</div>
          </div>
        </div>
        <div class="size-row">
          <label for=${`size-${placement.entity_id}`}>Marker size</label>
          <div class="size-input">
            <input
              id=${`size-${placement.entity_id}`}
              type="range"
              min="0.6"
              max="2.4"
              step="0.1"
              .value=${String(placement.size ?? 1)}
              @input=${(event: Event) => this._updatePlacementSize(placement.entity_id, event)}
            />
            <span class="size-value">${(placement.size ?? 1).toFixed(1)}x</span>
          </div>
        </div>
        <div class="row-actions">
          <button @click=${() => this._removePlacement(placement.entity_id)}>Remove</button>
        </div>
      </div>
    `;
  }

  private _renderEditorMarker(placement: FloorMapPlacement): TemplateResult {
    const stateObj = this.hass?.states[placement.entity_id];
    const indexEntry = this._entityIndex(placement.entity_id);
    const label = entityLabel(stateObj, indexEntry, placement.entity_id);
    const isLight = entityUsesLampPalette(placement.entity_id, stateObj, indexEntry);
    const markerClasses = [
      "marker",
      isLight ? "is-light" : "",
      entityIsActive(stateObj) ? "is-active" : "",
      stateObj ? "" : "is-muted",
    ]
      .filter(Boolean)
      .join(" ");

    return html`
      <div
        class=${markerClasses}
        style=${`left:${placement.x * 100}%; top:${placement.y * 100}%; --marker-scale:${placement.size ?? 1};`}
      >
        <div
          class="marker-chip"
          data-entity-id=${placement.entity_id}
          title=${label}
          aria-label=${label}
        >
          <span class="marker-icon"><ha-icon .icon=${entityIcon(placement.entity_id, stateObj, indexEntry)}></ha-icon></span>
        </div>
      </div>
    `;
  }

  private _renderEditorRoom(room: FloorMapRoom, preview = false): TemplateResult {
    const activeLights = activeLightPlacementsForRoom(
      room,
      this._draftPlacements,
      (entityId) => this.hass?.states[entityId],
      (entityId) => this._entityIndex(entityId)
    );
    const background = createRoomLightingBackground(room, activeLights);

    return html`
      <div class="room ${background ? "is-lit" : ""}" style=${roomStyle(room)}>
        <div
          class="room-lighting"
          style=${`${background ? `background:${background};` : ""} clip-path:${roomClipPath(room)};`}
        ></div>
        <svg class="room-outline-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon class=${preview ? "room-draft-shape" : "room-outline"} points=${roomPolygonPoints(room)}></polygon>
        </svg>
        <div class="room-label">${room.name}</div>
      </div>
    `;
  }

  private _renderRoomPointHandles(room: FloorMapRoom): TemplateResult[] {
    return room.points.map(
      (point, index) => html`<div
        class="room-point-handle"
        data-room-id=${room.id}
        data-room-point-index=${String(index)}
        style=${roomPointHandleStyle(point)}
        title=${`${room.name} point ${index + 1}`}
      ></div>`
    );
  }

  private _renderDraftRoom(): TemplateResult {
    const draftRoom: FloorMapRoom = {
      id: "draft-room",
      name: this._pendingRoomName ?? DEFAULT_ROOM_NAME,
      points: this._pendingRoomPoints,
    };
    return this._renderEditorRoom(draftRoom, true);
  }

  private async _loadEntityIndex(): Promise<void> {
    if (!this.hass) {
      return;
    }
    try {
      const payload = await this.hass.callWS<
        { entities?: CompactEntityRegistryEntry[] } | CompactEntityRegistryEntry[]
      >({ type: "config/entity_registry/list_for_display" });
      const rows = Array.isArray(payload) ? payload : payload.entities ?? [];
      const decoded = rows
        .map((entry) => decodeEntityRegistryEntry(entry))
        .filter((entry): entry is EntityIndexEntry => entry !== null)
        .sort((left, right) => left.name.localeCompare(right.name));
      this._entities = decoded.length ? decoded : this._fallbackEntitiesFromStates();
    } catch (error) {
      this._entities = this._fallbackEntitiesFromStates();
      if (!this._entities.length) {
        this._error = error instanceof Error ? error.message : "Unable to load entity list";
      }
    }
  }

  private _fallbackEntitiesFromStates(): EntityIndexEntry[] {
    const states = this.hass?.states ?? {};
    return Object.values(states)
      .map((stateObj) => ({
        entity_id: stateObj.entity_id,
        name: entityLabel(stateObj, undefined, stateObj.entity_id),
        icon: entityIcon(stateObj.entity_id, stateObj, undefined),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private _filteredEntities(): EntityIndexEntry[] {
    const query = this._query.trim().toLowerCase();
    const placedIds = new Set(this._draftPlacements.map((placement) => placement.entity_id));
    return this._entities
      .filter((entry) => !placedIds.has(entry.entity_id))
      .filter((entry) => {
        if (!query) {
          return true;
        }
        return (
          entry.name.toLowerCase().includes(query) ||
          entry.entity_id.toLowerCase().includes(query)
        );
      })
      .slice(0, 50);
  }

  private _entityIndex(entityId: string): EntityIndexEntry | undefined {
    return this._entities.find((entry) => entry.entity_id === entityId);
  }

  private _startPlacement(entityId: string): void {
    this._pendingRoomName = null;
    this._pendingRoomPoints = [];
    this._pendingEntityId = entityId;
  }

  private _pendingEntityLabel(): string {
    if (!this._pendingEntityId) {
      return "entity";
    }
    return this._entityIndex(this._pendingEntityId)?.name ?? this._pendingEntityId;
  }

  private _cancelPendingPlacement = (): void => {
    this._pendingEntityId = null;
  };

  private _removePlacement(entityId: string): void {
    this._draftPlacements = this._draftPlacements.filter(
      (placement) => placement.entity_id !== entityId
    );
    this._dirty = true;
  }

  private _removeRoom(roomId: string): void {
    this._draftRooms = this._draftRooms.filter((room) => room.id !== roomId);
    this._dirty = true;
  }

  private _updatePlacementSize(entityId: string, event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    const nextSize = Number.parseFloat(target.value);
    this._draftPlacements = this._draftPlacements.map((placement) =>
      placement.entity_id === entityId
        ? {
            ...placement,
            size: Number.isFinite(nextSize) ? Math.max(0.6, Math.min(2.4, nextSize)) : 1,
          }
        : placement
    );
    this._dirty = true;
  }

  private _updateRoomName(roomId: string, event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    const nextName = target.value.trim() || DEFAULT_ROOM_NAME;
    this._draftRooms = this._draftRooms.map((room) =>
      room.id === roomId
        ? {
            ...room,
            name: nextName,
          }
        : room
    );
    this._dirty = true;
  }

  private _onQueryInput(event: Event): void {
    this._query = (event.currentTarget as HTMLInputElement).value;
  }

  private _onRoomNameInput = (event: Event): void => {
    this._roomName = (event.currentTarget as HTMLInputElement).value;
  };

  private _startRoomDraw = (): void => {
    this._pendingEntityId = null;
    this._pendingRoomName = this._roomName.trim() || DEFAULT_ROOM_NAME;
    this._pendingRoomPoints = [];
  };

  private _cancelRoomDraw = (): void => {
    this._pendingRoomName = null;
    this._pendingRoomPoints = [];
  };

  private _undoPendingRoomPoint = (): void => {
    this._pendingRoomPoints = this._pendingRoomPoints.slice(0, -1);
  };

  private _finishRoomDraw = (): void => {
    if (!this._pendingRoomName || this._pendingRoomPoints.length < MIN_ROOM_POINTS) {
      return;
    }

    this._draftRooms = [
      ...this._draftRooms,
      {
        id: generateRoomId(),
        name: this._pendingRoomName,
        points: this._pendingRoomPoints,
      },
    ];
    this._dirty = true;
    this._pendingRoomName = null;
    this._pendingRoomPoints = [];
  };

  private async _onUploadFloorplan(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this._uploading = true;
    this._error = null;
    try {
      const contentBase64 = await fileToBase64(file);
      const layout = await this.hass!.callWS<FloorMapLayout>({
        type: UPLOAD_FLOORPLAN_COMMAND,
        file_name: file.name,
        media_type: file.type,
        content_base64: contentBase64,
      });
      this._layout = layout;
      this._imageUrl = await this._resolveImageUrl(layout);
      await this._afterLayoutLoad(layout);
    } catch (error) {
      this._error = error instanceof Error ? error.message : "Unable to upload floor plan";
    } finally {
      this._uploading = false;
      input.value = "";
    }
  }

  private async _saveLayout(): Promise<void> {
    if (!this.hass) {
      return;
    }
    this._saving = true;
    this._error = null;
    try {
      const layout = await this.hass.callWS<FloorMapLayout>({
        type: SAVE_LAYOUT_COMMAND,
        placements: this._draftPlacements,
        rooms: this._draftRooms,
      });
      this._layout = layout;
      this._dirty = false;
    } catch (error) {
      this._error = error instanceof Error ? error.message : "Unable to save layout";
    } finally {
      this._saving = false;
    }
  }

  private _onEditorPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    const marker = target.closest<HTMLElement>(".marker-chip");
    const roomPointHandle = target.closest<HTMLElement>(".room-point-handle");
    const surface = this._mapSurface();
    if (!surface) {
      return;
    }

    if (this._pendingRoomName) {
      return;
    }

    if (!this._pendingEntityId && roomPointHandle) {
      const roomId = roomPointHandle.dataset.roomId;
      const pointIndex = Number(roomPointHandle.dataset.roomPointIndex);
      if (!roomId || !Number.isInteger(pointIndex)) {
        return;
      }
      this._panState = {
        mode: "room-point",
        pointerId: event.pointerId,
        roomId,
        pointIndex,
      };
      event.preventDefault();
      surface.setPointerCapture(event.pointerId);
      return;
    }

    if (marker) {
      const entityId = marker.dataset.entityId;
      if (!entityId) {
        return;
      }
      this._panState = { mode: "marker", pointerId: event.pointerId, entityId };
      event.preventDefault();
      surface.setPointerCapture(event.pointerId);
      return;
    }

    this._panState = {
      mode: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: this._panX,
      startPanY: this._panY,
    };
    this._isPanning = true;
    surface.setPointerCapture(event.pointerId);
  }

  private _onEditorPointerMove(event: PointerEvent): void {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }

    if (this._panState.mode === "pan") {
      this._panX = this._panState.startPanX + (event.clientX - this._panState.startX);
      this._panY = this._panState.startPanY + (event.clientY - this._panState.startY);
      return;
    }

    const activeState = this._panState;
    if (activeState.mode === "marker") {
      const point = this._normalizedPointFromClient(event.clientX, event.clientY);
      if (!point) {
        return;
      }
      this._draftPlacements = this._draftPlacements.map((placement) =>
        placement.entity_id === activeState.entityId
          ? { ...placement, x: point.x, y: point.y }
          : placement
      );
      this._dirty = true;
      return;
    }

    const point = this._normalizedPointFromClient(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    if (activeState.mode === "room-point") {
      this._draftRooms = this._draftRooms.map((room) =>
        room.id === activeState.roomId
          ? {
              ...room,
              points: room.points.map((roomPoint, index) =>
                index === activeState.pointIndex ? clampRoomPoint(point) : roomPoint
              ),
            }
          : room
      );
      this._dirty = true;
    }
  }

  private _onEditorPointerUp(event: PointerEvent): void {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }

    const surface = this._mapSurface();
    surface?.releasePointerCapture(event.pointerId);
    this._isPanning = false;
    this._panState = undefined;
  }

  private _onEditorMapClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest(".marker-chip") || target.closest(".room-point-handle")) {
      return;
    }

    const point = this._normalizedPointFromClient(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    if (this._pendingRoomName) {
      this._pendingRoomPoints = [...this._pendingRoomPoints, clampRoomPoint(point)];
      return;
    }

    if (!this._pendingEntityId || !this._layout?.image) {
      return;
    }

    this._draftPlacements = [
      ...this._draftPlacements,
      {
        entity_id: this._pendingEntityId,
        x: point.x,
        y: point.y,
        show_state: false,
        size: 1,
      },
    ];
    this._dirty = true;
    this._pendingEntityId = null;
  }
}

defineOnce("floor-map-card-editor", FloorMapCardEditor);
defineOnce("floor-map", FloorMapCard);
defineOnce("ha-panel-floormap", FloorMapPanel);

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
if (!window.customCards.find((card) => card.type === "floor-map")) {
  window.customCards.push({
    type: "floor-map",
    name: "FloorMap",
    preview: false,
    description: "Render and control entities on a shared floor plan.",
  });
}
