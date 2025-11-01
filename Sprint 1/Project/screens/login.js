import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function Login({navigation}) {
    return (
        <View style={styles.container}>
            <Text>Login Screen</Text>
            <Button title="go to med-manage" 
            onPress={() => navigation.navigate("med-manage")}/>
        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 60,
    },
});