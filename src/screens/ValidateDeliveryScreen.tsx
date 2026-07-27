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
  'ValidateDelivery'
>;

export default function ValidateDeliveryScreen({
  route,
  navigation,
}: Props) {
  const { orderId } = route.params;

  async function handleValidate(
    code: string,
  ) {
    await deliveryService.confirmDelivery(
      orderId,
      code,
    );

    navigation.replace(
      'Success',
      {
        orderId,
      },
    );
  }

  return (
    <CodeValidationLayout
      title="Validar entrega"
      instruction="Peça o código de entrega para quem está recebendo"
      helpText="O destinatário não recebeu o código de entrega?"
      buttonText="VALIDAR ENTREGA"
      onBack={() =>
        navigation.goBack()
      }
      onValidate={handleValidate}
    />
  );
}
