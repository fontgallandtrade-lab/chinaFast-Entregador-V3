import React, { useRef, useState } from 'react';
import { Alert, Keyboard, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = { title: string; instruction: string; helpText: string; buttonText: string; expectedCode: string; onBack: () => void; onSuccess: () => void };
const CODE_LENGTH = 5;

export default function CodeValidationLayout({ title, instruction, helpText, buttonText, expectedCode, onBack, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  function handleChange(value: string) { setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH)); }
  function validate() {
    Keyboard.dismiss();
    if (code !== expectedCode) { Alert.alert('Código inválido', 'Confira o código informado.'); return; }
    onSuccess();
  }
  return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
    <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></TouchableOpacity><Text style={styles.headerTitle}>{title}</Text></View>
    <TouchableOpacity activeOpacity={1} style={styles.formCard} onPress={() => inputRef.current?.focus()}>
      <Text style={styles.instruction}><Text style={styles.required}>* </Text>{instruction}</Text>
      <View style={styles.codeRow}>{Array.from({length: CODE_LENGTH}).map((_,index)=>{const active=index===code.length&&code.length<CODE_LENGTH;return <View key={index} style={[styles.codeBox,active&&styles.codeBoxActive]}><Text style={styles.codeDigit}>{code[index]??''}</Text></View>;})}</View>
      <TextInput ref={inputRef} value={code} onChangeText={handleChange} keyboardType="number-pad" maxLength={CODE_LENGTH} autoFocus style={styles.hiddenInput}/>
      <Text style={styles.help}>{helpText}</Text><Text style={styles.test}>Teste: use {expectedCode}</Text>
    </TouchableOpacity>
    <View style={styles.footer}><TouchableOpacity disabled={code.length!==CODE_LENGTH} onPress={validate} style={[styles.button,code.length!==CODE_LENGTH&&styles.buttonDisabled]}><Text style={[styles.buttonText,code.length!==CODE_LENGTH&&styles.buttonTextDisabled]}>{buttonText}</Text></TouchableOpacity></View>
  </SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:'#0D0D0D'},header:{height:112,backgroundColor:'#2D2D2D',flexDirection:'row',alignItems:'center',paddingHorizontal:24},backButton:{width:58,height:58,justifyContent:'center'},backText:{color:'#FFF',fontSize:54,lineHeight:58,fontWeight:'300'},headerTitle:{color:'#FFF',fontSize:30,fontWeight:'900'},formCard:{backgroundColor:'#2D2D2D',marginTop:40,paddingHorizontal:32,paddingTop:42,paddingBottom:38},instruction:{color:'#FFF',fontSize:26,lineHeight:38,fontWeight:'900'},required:{color:'#FF4D6D'},codeRow:{flexDirection:'row',justifyContent:'space-between',marginTop:44},codeBox:{width:62,height:88,borderRadius:15,borderWidth:1,borderColor:'#454545',backgroundColor:'#111',alignItems:'center',justifyContent:'center'},codeBoxActive:{borderWidth:3,borderColor:'#FF784E'},codeDigit:{color:'#FFF',fontSize:32,fontWeight:'900'},hiddenInput:{position:'absolute',width:1,height:1,opacity:0},help:{color:'#FF784E',fontSize:18,fontWeight:'800',marginTop:38},test:{color:'#999',fontSize:15,marginTop:22},footer:{marginTop:'auto',backgroundColor:'#2D2D2D',paddingHorizontal:32,paddingTop:28,paddingBottom:34},button:{height:70,borderRadius:22,backgroundColor:'#FF784E',alignItems:'center',justifyContent:'center'},buttonDisabled:{backgroundColor:'#151515'},buttonText:{color:'#FFF',fontSize:18,fontWeight:'900'},buttonTextDisabled:{color:'#505050'}});
