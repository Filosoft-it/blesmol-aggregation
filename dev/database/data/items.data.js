const testItems = [
  {
    _id: 'item1',
    name: 'Laptop',
    description: 'A high-performance laptop for gaming and work.',
    users: ['user1'],
    externalId: 101,
    variant: {
      color: 'Green',
      size: 'Extra Large',
      users: ['user1']
    },
    createAt: new Date('2023-11-01T10:00:00Z'),
    updateAt: new Date('2023-11-10T10:00:00Z'),
    translations: {
      it: {
        name: 'Laptop',
        description: 'Un laptop ad alte prestazioni per il gioco e il lavoro.'
      },
      en: {
        name: 'Laptop',
        description: 'A high-performance laptop for gaming and work.'
      }
    }
  },
  {
    _id: 'item2',
    name: 'Headphones',
    description: 'Noise-cancelling over-ear headphones.',
    users: ['user2'],
    externalId: 102,
    variant: {
      color: 'Black',
      size: 'Small',
      users: ['user1']
    },
    createAt: new Date('2023-11-02T11:00:00Z'),
    updateAt: new Date('2023-11-12T11:00:00Z'),
    translations: {
      it: {
        name: 'Cuffie',
        description: 'Cuffie over-ear con cancellazione del rumore.'
      },
      en: {
        name: 'Headphones',
        description: 'Noise-cancelling over-ear headphones.'
      }
    }
  },
  {
    _id: 'item3',
    name: 'Smartphone',
    description: 'Latest model smartphone with amazing features.',
    users: ['user1'],
    externalId: 103,
    variant: {
      color: 'Yellow',
      size: 'Medium',
      users: ['user1']
    },
    createAt: new Date('2023-11-03T12:00:00Z'),
    updateAt: new Date('2023-11-13T12:00:00Z'),
    translations: {
      it: {
        name: 'Smartphone',
        description: 'Ultimo modello di smartphone con funzionalità incredibili.'
      },
      en: {
        name: 'Smartphone',
        description: 'Latest model smartphone with amazing features.'
      }
    }
  }
];

module.exports = { testItems };