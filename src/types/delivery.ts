export type DeliveryType = 'urban' | 'intercity';

export type Delivery = {
  id: number;
  public_code: string;

  package_type?: string | null;
  package_description?: string | null;
  package_weight_kg?: number | null;
  service_type?: string | null;

  route_distance_km: number;
  billable_distance_km: number;

  delivery_type: DeliveryType;

  distance_outbound_km: number;
  distance_return_km: number;
  distance_total_km: number;

  driver_amount: number;
  earnings_per_km: number;

  estimated_duration_minutes?: number | null;
  payment_method?: string | null;
  status: string;
  created_at?: string;

  pickup_street: string;
  pickup_number?: string | null;
  pickup_neighborhood?: string | null;
  pickup_city: string;
  pickup_state?: string | null;
  pickup_latitude?: number | string | null;
  pickup_longitude?: number | string | null;

  destination_street: string;
  destination_number?: string | null;
  destination_neighborhood?: string | null;
  destination_city: string;
  destination_state?: string | null;
  destination_latitude?: number | string | null;
  destination_longitude?: number | string | null;

  pickup_contact_name?: string | null;
  pickup_contact_phone?: string | null;
  destination_contact_name?: string | null;
  destination_contact_phone?: string | null;
};

export type AvailableDeliveriesResponse = {
  success: boolean;
  total: number;
  deliveries: Delivery[];
};

export type AcceptDeliveryResponse = {
  success: boolean;
  message: string;
  delivery: {
    id: number;
    public_code: string;
    status: string;
    driver_amount: number;
  };
};
