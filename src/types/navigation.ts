import type { Delivery } from './delivery';

export type RootStackParamList = {
  Login: undefined;

  RegisterDriver: undefined;

  Home: undefined;

  Wallet: undefined;

  Order: {
    delivery: Delivery;
  };

  Pickup: {
    orderId: number;
  };

  ValidatePickup: {
    orderId: number;
  };

  PickupValidated: {
    orderId: number;
  };

  Delivery: {
    orderId: number;
  };

  ValidateDelivery: {
    orderId: number;
  };

  Success: {
    orderId: number;
  };
};
