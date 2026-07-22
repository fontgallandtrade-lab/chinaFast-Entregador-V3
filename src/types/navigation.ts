export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Order: {
    orderId: number;
  };
  Pickup: {
    orderId: number;
  };
  ValidatePickup: {
    orderId: number;
  };
  Delivery: {
    orderId: number;
  };
  Success: {
    orderId: number;
  };
};
