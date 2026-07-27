export interface ChartPoint {
  label: string;
  value: number;
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface AnalyticsOverviewData {
  success: boolean;
  vehicles: {
    success: boolean;
    total_vehicles: number;
    avg_price: number | null;
    total_brands: number;
    total_models: number;
  };
  conversations: {
    success: boolean;
    total_conversations: number;
    total_messages: number;
    avg_messages_per_conversation: number;
  };
}

export interface TypeDistributionItem {
  vehicle_type: string | null;
  count: number;
  avg_price: number | null;
}

export interface VehicleTypeData {
  success: boolean;
  count: number;
  data: TypeDistributionItem[];
}

export interface FuelDistributionItem {
  fuel: string | null;
  count: number;
  avg_price: number | null;
}

export interface VehicleFuelData {
  success: boolean;
  count: number;
  data: FuelDistributionItem[];
}

export interface TransmissionDistributionItem {
  transmission: string | null;
  count: number;
}

export interface VehicleTransmissionData {
  success: boolean;
  count: number;
  data: TransmissionDistributionItem[];
}

export interface YearStatsItem {
  year: number;
  count: number;
  avg_price: number | null;
}

export interface VehicleYearData {
  success: boolean;
  count: number;
  data: YearStatsItem[];
}

export interface PriceRangeItem {
  price_range: string;
  count: number;
}

export interface VehiclePriceData {
  success: boolean;
  count: number;
  data: PriceRangeItem[];
}

export interface BrandRankingItem {
  brand_id: number;
  manufacturer: string;
  model_count: number | null;
  year_count: number | null;
  total_listings: number | null;
  average_price: number | null;
}

export interface BrandRankingData {
  success: boolean;
  count: number;
  limit: number;
  data: BrandRankingItem[];
}
