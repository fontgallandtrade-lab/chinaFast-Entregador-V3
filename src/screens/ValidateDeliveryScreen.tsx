import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CodeValidationLayout from '../components/CodeValidationLayout';
import type { RootStackParamList } from '../types/navigation';
type Props = NativeStackScreenProps<RootStackParamList,'ValidateDelivery'>;
export default function ValidateDeliveryScreen({route,navigation}:Props){return <CodeValidationLayout title="Validar entrega" instruction="Peça o código de entrega para o cliente" helpText="O cliente não recebeu o código de entrega?" buttonText="VALIDAR ENTREGA" expectedCode="54321" onBack={()=>navigation.goBack()} onSuccess={()=>navigation.replace('Success',{orderId:route.params.orderId})}/>;}
