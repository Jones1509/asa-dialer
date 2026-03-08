export interface Lead {
  id: string;
  company: string;
  phone: string;
  website: string;
  status: 'new' | 'done' | 'recall' | 'busy';
}

export const leadsData: Lead[] = [
  { id: 'e489527d', company: 'Tejn•el', phone: '+45 56 48 16 00', website: 'http://www.tejn-el.dk/', status: 'new' },
  { id: 'f2a13b8c', company: 'Nielsen El A/S', phone: '+45 70 22 11 33', website: 'http://www.nielsenel.dk/', status: 'new' },
  { id: 'g7c24d9e', company: 'Sørensen VVS', phone: '+45 44 55 66 77', website: '', status: 'recall' },
  { id: 'h8d35e0f', company: 'Hansen Elektro', phone: '+45 31 22 44 88', website: 'http://www.hansenel.dk/', status: 'done' },
  { id: 'i9e46f1g', company: 'Bech & Partners', phone: '+45 60 77 88 99', website: '', status: 'new' },
  { id: 'j0f57g2h', company: 'Nordvest El', phone: '+45 50 11 22 33', website: 'http://nordvest-el.dk/', status: 'new' },
  { id: 'k1g68h3i', company: 'Randers Elektrik', phone: '+45 86 42 31 10', website: '', status: 'busy' },
  { id: 'l2h79i4j', company: 'TechHuse ApS', phone: '+45 32 44 11 00', website: 'http://techhuse.dk/', status: 'new' },
  { id: 'm3i80j5k', company: 'Vestergaard El', phone: '+45 97 13 44 55', website: '', status: 'new' },
  { id: 'n4j91k6l', company: 'Smart Byg', phone: '+45 70 60 50 40', website: 'http://smartbyg.dk/', status: 'recall' },
];
