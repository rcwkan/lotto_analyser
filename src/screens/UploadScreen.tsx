import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator, Card } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import { useData } from '../context/DataContext';
import { LottoDraw } from '../types';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';



export default function UploadScreen() {
  const { setDraws, fileName, setFileName } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const pickAndParseCsv = async () => {
    setLoading(true);
    setError('');
    setFileName('');
    setDraws([]);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setLoading(false);
        return;
      }

      const fileAsset = result.assets[0];
      setFileName(fileAsset.name);

      const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri);

      Papa.parse<LottoDraw>(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically converts numbers
        complete: (results) => {
          // Validate data structure
          if (results.data.length > 0 && 'B1' in results.data[0] && 'BB' in results.data[0]) {

            const rData = results.data;
            rData.sort(function (a, b) {
              return a.Date > b.Date ? -1 : 1; // sort in descending order
            })


            setDraws(results.data);
          } else {
            setError('CSV format is incorrect. Ensure columns are: date,B1,B2,B3,B4,B5,B6,BB');
          }
          setLoading(false);
        },
        error: (err: any) => {
          setError(`Parsing Error: ${err.message}`);
          setLoading(false);
        }
      });

    } catch (err) {
      setError('Failed to read file.');
      setLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Upload Lotto History" subtitle="Select a CSV file to begin analysis" />
        <Card.Content>
          <Button
            icon="upload"
            mode="contained"
            onPress={pickAndParseCsv}
            disabled={loading}
            style={styles.button}
          >
            Select CSV File
          </Button>
          {loading && <ActivityIndicator animating={true} style={styles.feedback} />}
          {error && <Text style={[styles.feedback, styles.error]}>{error}</Text>}
          {fileName && !error && <Text style={styles.feedback}>Loaded: {fileName}</Text>}
        </Card.Content>
      </Card>
      <View style={styles.bottomBanner}>
        <BannerAd
          unitId="ca-app-pub-5605412363416280/2561232420" // Use real unit ID in production
          size={BannerAdSize.FULL_BANNER}

        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { padding: 8 },
  button: { marginVertical: 10 },
  feedback: { marginTop: 15, textAlign: 'center' },
  error: { color: 'red' },
  bottomBanner: {
    position: "absolute",
    bottom: 0
  },
});