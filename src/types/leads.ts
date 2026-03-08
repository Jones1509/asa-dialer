export interface Lead {
  id: string;
  campaign_id: string;
  company: string;
  phone: string;
  email: string | null;
  website: string | null;
  contact_person: string | null;
  status: string;
  note: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}
