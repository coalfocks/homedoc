export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Property {
  id: string;
  name: string;
  nickname?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  userId: string;
  image?: string;
  areas: Area[];
}

export interface Area {
  id: string;
  name: string;
  description: string;
  propertyId: string;
  image?: string;
  notes: Note[];
  todos: Todo[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  areaId: string;
}

export interface Todo {
  id: string;
  title: string;
  context?: string;
  quotes?: string;
  pricing?: string;
  plan?: string;
  createdAt: string;
  updatedAt: string;
  areaId: string;
}

export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  name: 'John Doe',
};

export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Beach House',
    address_line_1: '123 Ocean Drive',
    city: 'Malibu',
    state: 'CA',
    zip_code: '90265',
    userId: '1',
    image: 'https://picsum.photos/800/600?random=1',
    areas: [
      {
        id: '1',
        name: 'Living Room',
        description: 'Main living area with ocean view',
        propertyId: '1',
        image: 'https://picsum.photos/800/600?random=2',
        notes: [
          {
            id: '1',
            title: 'Window Maintenance',
            content: 'Windows need cleaning and sealant check',
            images: ['https://picsum.photos/200/300'],
            createdAt: '2024-03-20T10:00:00Z',
            updatedAt: '2024-03-20T10:00:00Z',
            areaId: '1',
          },
        ],
        todos: [
          {
            id: 't1',
            title: 'Replace carpet',
            context: 'Carpet is worn from years of use',
            pricing: '$1200 estimated',
            plan: 'Get quotes from local installers',
            createdAt: '2024-03-19T12:00:00Z',
            updatedAt: '2024-03-19T12:00:00Z',
            areaId: '1',
          },
        ],
      },
      {
        id: '2',
        name: 'Kitchen',
        description: 'Modern kitchen with island',
        propertyId: '1',
        image: 'https://picsum.photos/800/600?random=3',
        notes: [
          {
            id: '2',
            title: 'Appliance Check',
            content: 'All appliances working properly',
            images: ['https://picsum.photos/200/300'],
            createdAt: '2024-03-20T11:00:00Z',
            updatedAt: '2024-03-20T11:00:00Z',
            areaId: '2',
          },
        ],
        todos: [
          {
            id: 't2',
            title: 'Upgrade fridge',
            context: 'Current fridge is old and loud',
            quotes: 'Quote1 $1000, Quote2 $1200',
            pricing: '$1000 - $1200',
            plan: 'Compare energy ratings and decide',
            createdAt: '2024-03-20T12:00:00Z',
            updatedAt: '2024-03-20T12:00:00Z',
            areaId: '2',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Mountain Cabin',
    address_line_1: '456 Pine Road',
    city: 'Aspen',
    state: 'CO',
    zip_code: '81611',
    userId: '1',
    image: 'https://picsum.photos/800/600?random=4',
    areas: [
      {
        id: '3',
        name: 'Deck',
        description: 'Outdoor deck with mountain views',
        propertyId: '2',
        image: 'https://picsum.photos/800/600?random=5',
        notes: [
          {
            id: '3',
            title: 'Deck Maintenance',
            content: 'Need to reseal deck before winter',
            images: ['https://picsum.photos/200/300'],
            createdAt: '2024-03-19T15:00:00Z',
            updatedAt: '2024-03-19T15:00:00Z',
            areaId: '3',
          },
        ],
        todos: [
          {
            id: 't3',
            title: 'Buy patio furniture',
            context: 'Need seating for six people',
            pricing: '$600 budget',
            plan: 'Check summer sales',
            createdAt: '2024-03-21T09:00:00Z',
            updatedAt: '2024-03-21T09:00:00Z',
            areaId: '3',
          },
        ],
      },
    ],
  },
];
