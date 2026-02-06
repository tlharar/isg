import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register local font (no network dependency); files live in public/fonts/
const origin = typeof window !== 'undefined' ? window.location.origin : '';
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: `${origin}/fonts/Roboto-Regular.ttf`,
      fontWeight: 'normal',
    },
    {
      src: `${origin}/fonts/Roboto-Bold.ttf`,
      fontWeight: 'bold',
    },
  ],
});

/** Props for the certificate PDF content. */
export interface CertificateTemplateProps {
  participantName: string;
  trainingTitle: string;
  date: Date | string;
  durationHours: number;
  location: string;
  instructorName: string;
  /** Optional: general manager name for footer signature */
  managerName?: string;
}

const dateToString = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 40,
  },
  border: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 2,
    borderColor: '#1a365d',
    borderRadius: 2,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    fontFamily: 'Roboto',
    textAlign: 'center',
    color: '#1a365d',
    marginTop: 24,
    marginBottom: 32,
    letterSpacing: 1,
  },
  bodyBlock: {
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 12,
    fontFamily: 'Roboto',
    textAlign: 'center',
    lineHeight: 1.6,
    color: '#2d3748',
  },
  participantName: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'Roboto',
    textAlign: 'center',
    color: '#1a365d',
    marginVertical: 12,
  },
  trainingTitle: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'Roboto',
    textAlign: 'center',
    color: '#2d3748',
    marginBottom: 24,
  },
  details: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#718096',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  signatureBlock: {
    alignItems: 'center',
    width: '45%',
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#1a365d',
    marginTop: 36,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#718096',
  },
});

/**
 * Professional A4 Landscape certificate layout for @react-pdf/renderer.
 * Renders a single certificate page with border, title, participant text, details, and signature placeholders.
 */
export function CertificateTemplate({
  participantName,
  trainingTitle,
  date,
  durationHours,
  location,
  instructorName,
  managerName = 'Genel Müdür',
}: CertificateTemplateProps) {
  const dateStr = dateToString(date);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.inner}>
          <Text style={styles.title}>KATILIM SERTİFİKASI</Text>

          <View style={styles.bodyBlock}>
            <Text style={styles.bodyText}>
              Bu belge, aşağıda adı geçen kişinin ilgili eğitime katıldığını ve başarıyla tamamladığını belirtir.
            </Text>
          </View>

          <Text style={styles.participantName}>Sayın {participantName}</Text>
          <Text style={styles.trainingTitle}>{trainingTitle}</Text>
          <Text style={styles.bodyText}>eğitimini başarıyla tamamlamıştır.</Text>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Tarih: {dateStr}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Süre: {durationHours} saat</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Yer: {location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{instructorName}</Text>
            <Text style={styles.signatureLabel}>Eğitmen</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{managerName}</Text>
            <Text style={styles.signatureLabel}>Genel Müdür</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
