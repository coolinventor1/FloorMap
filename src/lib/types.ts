export interface FloorMapImage {
  filename: string;
  media_type: string;
  width?: number | null;
  height?: number | null;
  updated_at: string;
}

export interface FloorMapPlacement {
  entity_id: string;
  x: number;
  y: number;
  show_state: boolean;
}

export interface FloorMapLayout {
  image: FloorMapImage | null;
  placements: FloorMapPlacement[];
  image_url?: string | null;
}

export interface FloorMapCardConfig {
  type: string;
  show_labels?: boolean;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown> & {
    friendly_name?: string;
    icon?: string;
    unit_of_measurement?: string;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  user?: {
    is_admin?: boolean;
  };
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>
  ): Promise<void>;
  connection?: {
    subscribeEvents(
      callback: (event: unknown) => void,
      eventType?: string
    ): Promise<() => void>;
  };
}

export interface EntityIndexEntry {
  entity_id: string;
  name: string;
  icon?: string;
}

export interface TransformState {
  scale: number;
  panX: number;
  panY: number;
}

export interface ResolvedServiceAction {
  domain: string;
  service: string;
}
