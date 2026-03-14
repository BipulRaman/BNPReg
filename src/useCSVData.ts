import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import type { Registration } from './types';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSr7RZruLFOhIezzW-yxLLF5fxnihDqwp_sImjJX9zy31Tj-myVIM5sTnTX32rvee7ujZVYcl5tsfe-/pub?gid=1085732125&single=true&output=csv';

export function useCSVData() {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setTick(t => t + 1);
  };

  useEffect(() => {
    const url = `${CSV_URL}&_t=${Date.now()}`;
    Papa.parse<Record<string, string>>(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const parsed: Registration[] = results.data.map((row) => ({
          timestamp: row['Timestamp'] ?? '',
          email: row['Email Address'] ?? '',
          name: (row['Name'] ?? '').trim(),
          gender: (row['Gender'] ?? '').trim(),
          phone: row['Phone number'] ?? '',
          location: (row['Current Location (City, State)\r\n'] ?? row['Current Location (City, State) '] ?? row['Current Location (City, State)'] ?? '').trim(),
          pinCode: row['PIN Code'] ?? '',
          entryJNV: (row['Entry JNV'] ?? '').trim(),
          entryYear: parseInt(row['Entry Year in JNV'] ?? '0', 10) || 0,
          entryClass: parseInt(row['Entry Class in JNV'] ?? '0', 10) || 0,
          currentProfile: (row['Current Profile'] ?? '').trim(),
          organization: (row['Current Organization / Institute'] ?? '').trim(),
          designation: (row['Current Designation / Degree'] ?? '').trim(),
          participationRole: (row['I want to participate as'] ?? '').trim(),
          foodPreference: (row['Food Preferences'] ?? '').trim(),
          bloodDonation: (row['Willing to Donate Blood at Samagam Event ?'] ?? '').trim(),
          startupAid: (row['Interested in getting financial aid for your Startup ?'] ?? '').trim(),
          donationAmount: parseFloat(row['Donation Amount'] ?? '0') || 0,
        }));
        setData(parsed);
        setLoading(false);
      },
      error(err: Error) {
        setError(err.message);
        setLoading(false);
      },
    });
  }, [tick]);

  return { data, loading, error, refresh };
}
