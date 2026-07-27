import React from 'react';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import CodeValidationLayout from
  '../components/CodeValidationLayout';

import {
  deliveryService,
} from '../services/delivery';

import type {
  RootStackParamList,
} from '../types/navigation';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ValidatePickup'
>;

export default function ValidatePickupScreen({
  route,
  navigation,
}: Props) {
  const { orderId } = route.params;

  async function handleValidate(
    code: string,
  ) {
    await deliveryService.confirmPickup(
      orderId,
      code,
    );

    navigation.replace(
      'PickupValidated',
      {
        orderId,
      },
    );
  }

  return (
    <CodeValidationLayout
      title="Validar retirada"
      instruction="Peça o código de retirada para a empresa ou cliente"
      helpText="O responsável não recebeu o código de retirada?"
      buttonText="VALIDAR RETIRADA"
      onBack={() =>
        navigation.goBack()
      }
      onValidate={handleValidate}
    />
  );
}
