export interface ToyModel {
    toyId: number;               // ID iz API-ja
    name: string;
    permalink: string;
    description: string;
    targetGroup: string;
    productionDate: string;      // datum kao string
    price: number;
    imageUrl?: string;           // opcioni URL slike
    ageGroup: {                  // objekat za starosnu grupu
        ageGroupId: number;
        name: string;
        description: string;
    };
    type: {                      // objekat za tip igračke
        typeId: number;
        name: string;
        description: string;
    };
    status?: 'new' | 'reserved' | 'paid';
}
