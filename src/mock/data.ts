export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
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

export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  name: 'John Doe',
};

export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Beach House',
    address: '123 Ocean Drive, Malibu, CA',
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
      },
    ],
  },
  {
    id: '2',
    name: 'Mountain Cabin',
    address: '456 Pine Road, Aspen, CO',
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
      },
    ],
  },
]; 