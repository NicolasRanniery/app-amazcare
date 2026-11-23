import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const pdfService = {
  async generateAndSharePdf(htmlContent: string): Promise<string> {
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Relatório Clínico AMAZCARE',
        });
      } else if (Platform.OS === 'web') {
        // No navegador web, abre diretamente para impressão/download
        await Print.printAsync({ html: htmlContent });
      }

      return uri;
    } catch (error) {
      console.error('Erro ao gerar relatório em PDF:', error);
      throw error;
    }
  },
};
