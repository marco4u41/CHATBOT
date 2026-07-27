export interface Vehicle {
  brand: string;
  model: string;
  year: number;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  mileage_km?: number;
  price_usd?: number;
  body_type?: string;
  drive?: string;
  condition?: string;
  color?: string;
  cylinders?: number;
  passengers?: number;
  consumption?: string;
  advantages?: string[];
  disadvantages?: string[];
}

export interface GarageVehicle extends Vehicle {
  id: string;
  added_at: string;
  notes?: string;
  scores?: VehicleScores;
}

export interface VehicleScores {
  performance: number;
  economy: number;
  safety: number;
  comfort: number;
  reliability: number;
}

export interface VehicleComparisonRequest {
  vehicles: Vehicle[];
  focus?: "performance" | "economy" | "safety" | "value" | "all";
}

export interface DiagnosisRequest {
  vehicle: Vehicle;
  symptoms: string[];
  category?: string;
}

export interface DiagnosisResponse {
  diagnosis: string;
  possible_causes: string[];
  recommended_actions: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface RecommendationRequest {
  budget_usd: number;
  usage: string;
  priorities?: string[];
}

export interface PhysicalPanelFilters {
  budget?: number;
  terrain?: string;
  engine_type?: string;
}
