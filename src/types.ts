export interface Registration {
  timestamp: string;
  email: string;
  name: string;
  gender: string;
  phone: string;
  location: string;
  pinCode: string;
  entryJNV: string;
  entryYear: number;
  entryClass: number;
  currentProfile: string;
  organization: string;
  designation: string;
  participationRole: string;
  foodPreference: string;
  bloodDonation: string;
  startupAid: string;
  donationAmount: number;
}

export interface ChartDatum {
  name: string;
  value: number;
}
