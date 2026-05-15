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
  size: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface FloorMapLightingPlacement extends FloorMapPlacement {
  glowColor?: RGBColor;
}

export interface FloorMapPoint {
  x: number;
  y: number;
}

export interface FloorMapRoom {
  id: string;
  name: string;
  points: FloorMapPoint[];
  label_x: number;
  label_y: number;
}

export interface FloorMapLayout {
  image: FloorMapImage | null;
  placements: FloorMapPlacement[];
  rooms: FloorMapRoom[];
  image_url?: string | null;
  image_data_url?: string | null;
}

export interface FloorMapCardConfig {
  type: string;
  show_labels?: boolean;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown> & {
    brightness?: number;
    color_mode?: string;
    device_class?: string;
    friendly_name?: string;
    hs_color?: [number, number];
    icon?: string;
    percentage?: number;
    percentage_step?: number;
    rgb_color?: [number, number, number];
    rgbw_color?: [number, number, number, number];
    rgbww_color?: [number, number, number, number, number];
    speed_count?: number;
    supported_color_modes?: string[];
    unit_of_measurement?: string;
    xy_color?: [number, number];
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
