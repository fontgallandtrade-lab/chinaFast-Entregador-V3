export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Order: {
    orderId: number;
  };
  Pickup: {
    orderId: number;
  };
  Delivery: {
    orderId: number;
  };
  Success: {
    orderId: number;
  };
};
