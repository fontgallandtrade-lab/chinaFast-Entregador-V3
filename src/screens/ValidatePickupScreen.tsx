import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CodeValidationLayout from '../components/CodeValidationLayout';
import type { RootStackParamList } from '../types/navigation';
type Props = NativeStackScreenProps<RootStackParamList,'ValidatePickup'>;
export default function ValidatePickupScreen({route,navigation}:Props){return <CodeValidationLayout title="Validar retirada" instruction="Peça o código de retirada para a loja" helpText="A loja não recebeu o código de retirada?" buttonText="VALIDAR RETIRADA" expectedCode="12345" onBack={()=>navigation.goBack()} onSuccess={()=>navigation.replace('PickupValidated',{orderId:route.params.orderId})}/>;}
