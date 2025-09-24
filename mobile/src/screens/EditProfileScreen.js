import { useContext, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { AppCtx } from "../context/AppContext";

export default function EditProfileScreen() {
  const { user } = useContext(AppCtx);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const save = () => {
    console.log("Save profile", { name, email });
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Edit Profile</Text>
      <TextInput value={name} onChangeText={setName} style={s.input} placeholder="Name" />
      <TextInput value={email} onChangeText={setEmail} style={s.input} placeholder="Email" />
      <Button title="Save" onPress={save} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 12 },
});
