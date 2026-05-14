import { LitElement, css, html, nothing } from "lit";
import type { PropertyValues, TemplateResult } from "lit";

import { resolveEntityAction } from "./lib/entity-actions";
import {
  MAX_SCALE,
  MIN_SCALE,
  pointerToNormalizedPoint,
  zoomAroundPoint,
} from "./lib/floormap-math";
import type {
  EntityIndexEntry,
  FloorMapCardConfig,
  FloorMapLayout,
  FloorMapPlacement,
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
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      color-mix(in srgb, var(--floormap-surface) 80%, black 20%);
    background-size: 24px 24px, 24px 24px, auto;
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

  .map-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .markers {
    position: absolute;
    inset: 0;
  }

  .marker {
    position: absolute;
    transform: translate(-50%, -100%);
  }

  .marker-button,
  .marker-chip {
    display: inline-grid;
    place-items: center;
    width: 2.8rem;
    height: 2.8rem;
    min-width: 2.8rem;
    min-height: 2.8rem;
    aspect-ratio: 1 / 1;
    appearance: none;
    border: 2px solid var(--floormap-outline);
    border-radius: 50%;
    padding: 0;
    overflow: hidden;
    background: color-mix(in srgb, var(--floormap-surface) 82%, black 18%);
    color: inherit;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24);
    backdrop-filter: blur(10px);
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
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
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

function stateDisplay(stateObj?: HassEntity): string | undefined {
  if (!stateObj) {
    return undefined;
  }
  const unit = asString(stateObj.attributes.unit_of_measurement);
  return unit ? `${stateObj.state} ${unit}` : stateObj.state;
}

function entityLabel(stateObj: HassEntity | undefined, fallback: EntityIndexEntry | undefined, entityId: string): string {
  return (
    asString(stateObj?.attributes.friendly_name) ??
    fallback?.name ??
    entityId
  );
}

function entityIcon(stateObj: HassEntity | undefined, fallback: EntityIndexEntry | undefined): string {
  return (
    asString(stateObj?.attributes.icon) ??
    fallback?.icon ??
    "mdi:map-marker"
  );
}

function entityIsActive(stateObj: HassEntity | undefined): boolean {
  return Boolean(stateObj && stateObj.state === "on");
}

function entityUsesLampPalette(
  entityId: string,
  stateObj: HassEntity | undefined,
  fallback: EntityIndexEntry | undefined
): boolean {
  const domain = entityId.split(".")[0];
  if (domain === "light") {
    return true;
  }

  const name = entityLabel(stateObj, fallback, entityId).toLowerCase();
  if (name.includes("lamp")) {
    return true;
  }

  const icon = entityIcon(stateObj, fallback).toLowerCase();
  return icon.includes("lamp") || icon.includes("lightbulb");
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

  private _initialized = false;
  private _unsubscribe?: () => void;

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      void this._initialize();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
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
        <div class="muted">FloorMap currently has no card options. Add it with <code>type: custom:floor-map</code>.</div>
      </div>
    `;
  }
}

class FloorMapCard extends FloorMapBaseElement {
  static properties = {
    ...FloorMapBaseElement.properties,
    _config: { state: true },
    _isPanning: { state: true },
  };

  static styles = [
    baseStyles,
    css`
      ha-card {
        display: grid;
        gap: 0.75rem;
        padding: 0.9rem;
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
    return 7;
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
              <img class="map-image" src=${this._imageUrl} alt="Floor plan" />
              <div class="markers">
                ${this._layout.placements.map((placement) => this._renderCardMarker(placement))}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _renderCardMarker(placement: FloorMapPlacement): TemplateResult {
    const stateObj = this.hass?.states[placement.entity_id];
    const icon = entityIcon(stateObj, undefined);
    const label = entityLabel(stateObj, undefined, placement.entity_id);
    const isLight = entityUsesLampPalette(placement.entity_id, stateObj, undefined);
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
        style=${`left:${placement.x * 100}%; top:${placement.y * 100}%;`}
      >
        <button
          class="marker-button"
          title=${label}
          aria-label=${label}
          @click=${() => this._handleEntityTap(placement.entity_id)}
        >
          <span class="marker-icon"><ha-icon .icon=${icon}></ha-icon></span>
        </button>
      </div>
    `;
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

    if (stateObj) {
      fireEvent(this, "hass-more-info", { entityId });
    }
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
    if (target.closest(".marker-button")) {
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
}

class FloorMapPanel extends FloorMapBaseElement {
  static properties = {
    ...FloorMapBaseElement.properties,
    _entities: { state: true },
    _query: { state: true },
    _draftPlacements: { state: true },
    _pendingEntityId: { state: true },
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
      .placed-list {
        display: grid;
        gap: 0.5rem;
        max-height: 320px;
        overflow: auto;
      }

      .entity-row,
      .placed-row {
        display: grid;
        gap: 0.45rem;
        padding: 0.7rem;
        border: 1px solid var(--floormap-outline);
        border-radius: 8px;
        background: color-mix(in srgb, var(--floormap-surface) 88%, white 12%);
      }

      .entity-row-top,
      .placed-row-top {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .entity-meta,
      .placed-meta {
        min-width: 0;
        flex: 1 1 auto;
      }

      .entity-name,
      .placed-name {
        font-weight: 600;
      }

      .entity-id,
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

      .map-frame {
        min-height: 500px;
      }

      .map-surface {
        min-height: 500px;
      }

      .marker-chip {
        cursor: grab;
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
  private _pendingEntityId: string | null = null;
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
    | undefined;

  protected override async _afterInitialize(): Promise<void> {
    await this._loadEntityIndex();
  }

  protected override async _afterLayoutLoad(layout: FloorMapLayout): Promise<void> {
    this._draftPlacements = layout.placements.map((placement) => ({ ...placement }));
    this._dirty = false;
    this._pendingEntityId = null;
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
            <h3>Placed entities</h3>
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
              <img class="map-image" src=${this._imageUrl} alt="Floor plan" />
              <div class="markers">
                ${this._draftPlacements.map((placement) => this._renderEditorMarker(placement))}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _renderEntityRow(entry: EntityIndexEntry): TemplateResult {
    return html`
      <div class="entity-row">
        <div class="entity-row-top">
          <span class="marker-icon"><ha-icon .icon=${entry.icon ?? "mdi:devices"}></ha-icon></span>
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
          <span class="marker-icon"><ha-icon .icon=${entityIcon(stateObj, indexEntry)}></ha-icon></span>
          <div class="placed-meta">
            <div class="placed-name">${label}</div>
            <div class="placed-id">${placement.entity_id}</div>
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
        style=${`left:${placement.x * 100}%; top:${placement.y * 100}%;`}
      >
        <div
          class="marker-chip"
          data-entity-id=${placement.entity_id}
          title=${label}
          aria-label=${label}
          @pointerdown=${this._onMarkerPointerDown}
        >
          <span class="marker-icon"><ha-icon .icon=${entityIcon(stateObj, indexEntry)}></ha-icon></span>
        </div>
      </div>
    `;
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
        icon: entityIcon(stateObj, undefined),
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

  private _onQueryInput(event: Event): void {
    this._query = (event.currentTarget as HTMLInputElement).value;
  }

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
    const marker = (event.target as HTMLElement).closest<HTMLElement>(".marker-chip");
    const surface = this._mapSurface();
    if (!surface) {
      return;
    }

    if (marker) {
      const entityId = marker.dataset.entityId;
      if (!entityId) {
        return;
      }
      this._panState = { mode: "marker", pointerId: event.pointerId, entityId };
      marker.setPointerCapture(event.pointerId);
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

    const surface = this._mapSurface();
    if (!surface) {
      return;
    }
    const rect = surface.getBoundingClientRect();
    const activeState = this._panState;
    if (activeState.mode !== "marker") {
      return;
    }
    const point = pointerToNormalizedPoint(
      event.clientX,
      event.clientY,
      rect,
      this._transformState()
    );
    this._draftPlacements = this._draftPlacements.map((placement) =>
      placement.entity_id === activeState.entityId
        ? { ...placement, x: point.x, y: point.y }
        : placement
    );
    this._dirty = true;
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

  private _onMarkerPointerDown(event: PointerEvent): void {
    event.stopPropagation();
  }

  private _onEditorMapClick(event: MouseEvent): void {
    if (!this._pendingEntityId || !this._layout?.image) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest(".marker-chip")) {
      return;
    }

    const surface = this._mapSurface();
    if (!surface) {
      return;
    }
    const rect = surface.getBoundingClientRect();
    const point = pointerToNormalizedPoint(
      event.clientX,
      event.clientY,
      rect,
      this._transformState()
    );
    this._draftPlacements = [
      ...this._draftPlacements,
      {
        entity_id: this._pendingEntityId,
        x: point.x,
        y: point.y,
        show_state: false,
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
